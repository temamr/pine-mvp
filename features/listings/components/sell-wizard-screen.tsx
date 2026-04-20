"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Sparkles, UploadCloud } from "lucide-react";
import type { Category, ListingCondition } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { createSupabaseListingFromDraft, getSupabaseListingsClient } from "@/features/listings/lib/supabase-listings";
import { mockCategories } from "@/lib/mock/fixtures";
import { usePineStore } from "@/lib/mock/use-pine-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { listingDraftSchema } from "@/lib/validation/listing.schema";
import { conditionLabel } from "@/lib/utils/labels";

const steps = ["Категория", "Фото", "Описание", "Цена", "Локация", "Preview"] as const;
const conditions: ListingCondition[] = ["new", "like_new", "good", "fair", "for_parts"];
const mockPhotoUrls = [
  "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80"
];

type DraftState = {
  categoryId: string;
  title: string;
  description: string;
  price: string;
  condition: ListingCondition;
  locationLabel: string;
  imageUrls: string[];
};

type ErrorState = Partial<Record<keyof DraftState, string>>;

export function SellWizardScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const supabaseEnabled = isSupabaseConfigured();
  const createListing = usePineStore((state) => state.createListing);
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<ErrorState>({});
  const [saving, setSaving] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>(mockCategories);
  const [imageFiles, setImageFiles] = React.useState<Array<File | null>>([]);
  const [draft, setDraft] = React.useState<DraftState>({
    categoryId: mockCategories[0]?.id ?? "",
    title: "",
    description: "",
    price: "",
    condition: "good",
    locationLabel: "Hayes Valley",
    imageUrls: []
  });

  React.useEffect(() => {
    if (!supabaseEnabled) {
      setCategories(mockCategories);
      return;
    }

    let active = true;
    const { repositories } = getSupabaseListingsClient();

    repositories.listings
      .categories()
      .then((items) => {
        if (!active) {
          return;
        }

        setCategories(items);
        if (items[0]) {
          update("categoryId", items[0].id);
        }
      })
      .catch((error) => {
        toast({
          title: "Не удалось загрузить категории",
          description: error instanceof Error ? error.message : "Supabase вернул ошибку."
        });
      });

    return () => {
      active = false;
    };
    // update intentionally omitted because it mutates draft state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseEnabled, toast]);

  const qualityScore = React.useMemo(() => {
    let score = 20;
    if (draft.imageUrls.length >= 2) score += 20;
    if (draft.title.length >= 12) score += 15;
    if (draft.description.length >= 80) score += 25;
    if (Number(draft.price) > 0) score += 10;
    if (draft.locationLabel.length > 2) score += 10;
    return Math.min(score, 100);
  }, [draft]);

  function update<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validate() {
    const parsed = listingDraftSchema.safeParse({
      ...draft,
      price: draft.price
    });

    if (parsed.success) {
      setErrors({});
      return true;
    }

    const nextErrors: ErrorState = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (typeof field === "string" && field in draft) {
        nextErrors[field as keyof DraftState] = issue.message;
      }
    });
    setErrors(nextErrors);
    return false;
  }

  function nextStep() {
    if (step >= 2 && !validate()) {
      toast({ title: "Проверьте поля", description: "Подсказки уже отмечены в форме." });
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const fileList = Array.from(files).slice(0, 10 - draft.imageUrls.length);
    const urls = fileList.map((file) => URL.createObjectURL(file));
    update("imageUrls", [...draft.imageUrls, ...urls]);
    setImageFiles((current) => [...current, ...fileList]);
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const next = [...draft.imageUrls];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    update("imageUrls", next);
    setImageFiles((current) => {
      const nextFiles = [...current];
      const [file] = nextFiles.splice(index, 1);
      nextFiles.splice(target, 0, file ?? null);
      return nextFiles;
    });
  }

  function generateDescription() {
    const category = categories.find((item) => item.id === draft.categoryId)?.name.toLowerCase() ?? "товар";
    update(
      "description",
      `${draft.title || "Устройство"} в аккуратном состоянии. Подойдет тем, кто ищет надежный ${category} без лишних рисков. Готов показать серийный номер, дополнительные фото, состояние батареи или тесты производительности и договориться через Pine.`
    );
    toast({ title: "Описание предложено", description: "AI stub заполнил текст, его можно отредактировать." });
  }

  async function save(submitToModeration: boolean) {
    if (!validate()) return;

    if (supabaseEnabled) {
      setSaving(true);

      try {
        const listing = await createSupabaseListingFromDraft({
          categoryId: draft.categoryId,
          title: draft.title,
          description: draft.description,
          price: Number(draft.price),
          condition: draft.condition,
          locationLabel: draft.locationLabel,
          imageUrls: draft.imageUrls,
          imageFiles,
          submitToModeration
        });

        toast({
          title: submitToModeration ? "Отправлено на модерацию" : "Черновик сохранен",
          description: submitToModeration
            ? "Запись создана в Supabase и ожидает проверки."
            : "Черновик создан в Supabase."
        });
        router.push(submitToModeration ? "/profile/listings" : `/listings/${listing.id}`);
      } catch (error) {
        toast({
          title: "Не удалось сохранить объявление",
          description: error instanceof Error ? error.message : "Supabase вернул ошибку."
        });
      } finally {
        setSaving(false);
      }

      return;
    }

    const listing = createListing({
      categoryId: draft.categoryId,
      title: draft.title,
      description: draft.description,
      price: Number(draft.price),
      condition: draft.condition,
      locationLabel: draft.locationLabel,
      imageUrls: draft.imageUrls,
      submitToModeration
    });

    toast({
      title: submitToModeration ? "Отправлено на модерацию" : "Черновик сохранен",
      description: submitToModeration ? "Статус можно смотреть в моих объявлениях." : "Можно продолжить позже."
    });
    router.push(submitToModeration ? "/profile/listings" : `/listings/${listing.id}`);
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-white/92">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge variant="secondary">Создание объявления</Badge>
              <CardTitle className="mt-3 text-2xl">Соберите карточку для модерации</CardTitle>
            </div>
            <div className="w-full md:w-72">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Качество</span>
                <span>{qualityScore}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${qualityScore}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 md:grid-cols-6">
            {steps.map((item, index) => (
              <button
                key={item}
                className={index === step ? "rounded-lg bg-primary px-2 py-2 text-xs font-semibold text-white" : "rounded-lg border bg-white px-2 py-2 text-xs font-semibold text-muted-foreground"}
                onClick={() => setStep(index)}
              >
                {item}
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className="bg-white/94">
          <CardContent className="p-5">
            {step === 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={draft.categoryId === category.id ? "rounded-lg border-2 border-primary bg-primary/10 p-4 text-left font-semibold" : "rounded-lg border bg-background p-4 text-left font-semibold"}
                    onClick={() => update("categoryId", category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4">
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-background p-6 text-center">
                  <UploadCloud className="h-8 w-8 text-primary" />
                  <span className="mt-2 font-semibold">Загрузить фото</span>
                  <span className="text-sm text-muted-foreground">До 10 изображений, можно менять порядок</span>
                  <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => handleFiles(event.target.files)} />
                </label>
                <div className="flex flex-wrap gap-2">
                  {mockPhotoUrls.map((url, index) => (
                    <Button
                      key={url}
                      variant="outline"
                      onClick={() => {
                        update("imageUrls", [...draft.imageUrls, url]);
                        setImageFiles((current) => [...current, null]);
                      }}
                    >
                      <ImagePlus className="h-4 w-4" />
                      Mock фото {index + 1}
                    </Button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {draft.imageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="rounded-lg border bg-background p-2">
                      <div className="aspect-square rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => movePhoto(index, -1)}>←</Button>
                        <Button variant="outline" size="sm" onClick={() => movePhoto(index, 1)}>→</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium">
                  Название
                  <Input value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="Fujifilm X100V Silver kit" />
                  {errors.title ? <span className="text-xs text-destructive">{errors.title}</span> : null}
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Описание
                  <Textarea value={draft.description} onChange={(event) => update("description", event.target.value)} />
                  {errors.description ? <span className="text-xs text-destructive">{errors.description}</span> : null}
                </label>
                <Button variant="secondary" onClick={generateDescription}>
                  <Sparkles className="h-4 w-4" />
                  AI generate description
                </Button>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium">
                  Цена
                  <Input value={draft.price} onChange={(event) => update("price", event.target.value)} inputMode="numeric" placeholder="1180" />
                  {errors.price ? <span className="text-xs text-destructive">{errors.price}</span> : null}
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Состояние
                  <select
                    value={draft.condition}
                    onChange={(event) => update("condition", event.target.value as ListingCondition)}
                    className="h-11 rounded-lg border bg-white px-3 text-sm"
                  >
                    {conditions.map((condition) => (
                      <option key={condition} value={condition}>{conditionLabel[condition]}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium">
                  Локация
                  <Input value={draft.locationLabel} onChange={(event) => update("locationLabel", event.target.value)} />
                  {errors.locationLabel ? <span className="text-xs text-destructive">{errors.locationLabel}</span> : null}
                </label>
                <div className="surface-grid flex h-56 items-center justify-center rounded-lg border bg-background">
                  <div className="rounded-lg bg-white px-4 py-3 text-center shadow-soft">
                    <p className="font-semibold">{draft.locationLabel}</p>
                    <p className="text-sm text-muted-foreground">Карта подключится после выбора провайдера</p>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="grid gap-4">
                <h2 className="text-xl font-bold">{draft.title || "Название объявления"}</h2>
                <p className="text-2xl font-bold">${Number(draft.price || 0).toLocaleString("en-US")}</p>
                <p className="leading-7 text-muted-foreground">{draft.description || "Описание появится здесь."}</p>
                <Badge className="w-fit" variant="warning">Preview перед модерацией</Badge>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle>Подсказки качества</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>Добавьте 2-4 фото с разными ракурсами.</p>
            <p>Укажите состояние честно: это снижает жалобы после встречи.</p>
            <p>Цена около рыночной чаще приводит к первому сообщению в течение дня.</p>
            <p>{supabaseEnabled ? "Черновик сохраняется в Supabase со статусом draft." : "Черновик сохраняется локально как mock listing."}</p>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-20 z-20 grid gap-2 rounded-lg border bg-white/95 p-3 shadow-soft backdrop-blur md:bottom-4 md:grid-cols-[auto_1fr_auto_auto]">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((current) => Math.max(current - 1, 0))}>
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
        <div className="hidden md:block" />
        <Button variant="outline" disabled={saving} onClick={() => void save(false)}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save draft
        </Button>
        {step === steps.length - 1 ? (
          <Button disabled={saving} onClick={() => void save(true)}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit to moderation
          </Button>
        ) : (
          <Button onClick={nextStep}>
            Далее
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
