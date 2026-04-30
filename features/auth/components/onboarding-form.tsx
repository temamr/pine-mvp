"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function OnboardingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = React.useState(configured);
  const [saving, setSaving] = React.useState(false);
  const [userId, setUserId] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [city, setCity] = React.useState("Москва");
  const [region, setRegion] = React.useState("Москва");
  const [country, setCountry] = React.useState("Россия");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState("");
  const [acceptedPolicies, setAcceptedPolicies] = React.useState(false);

  React.useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setDisplayName(profile.display_name);
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
        const location =
          profile.location && typeof profile.location === "object" && !Array.isArray(profile.location)
            ? profile.location
            : {};
        setCity(typeof location.city === "string" ? location.city : "Москва");
        setRegion(typeof location.region === "string" ? location.region : "Москва");
        setCountry(typeof location.country === "string" ? location.country : "Россия");
      } else {
        setDisplayName(user.email?.split("@")[0] ?? "");
      }

      setLoading(false);
    });
  }, [configured]);

  async function uploadAvatar(id: string) {
    if (!avatarFile) {
      return avatarUrl;
    }

    const supabase = createSupabaseBrowserClient();
    const extension = avatarFile.name.split(".").pop() ?? "jpg";
    const path = `${id}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, {
      upsert: true,
      contentType: avatarFile.type
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  React.useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [avatarFile]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured) {
      toast({ title: "Проект еще не настроен", description: "Сохранение профиля станет доступно после подключения базы." });
      return;
    }

    if (!userId) {
      toast({ title: "Нужен вход", description: "Сначала войдите или создайте аккаунт." });
      router.push("/auth/sign-in?redirectTo=/onboarding");
      return;
    }

    if (!acceptedPolicies) {
      toast({
        title: "Нужно согласие",
        description: "Подтвердите согласие на обработку персональных данных."
      });
      return;
    }

    setSaving(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const uploadedAvatarUrl = await uploadAvatar(userId);
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        display_name: displayName,
        email,
        avatar_url: uploadedAvatarUrl || null,
        bio: bio || null,
        role: "buyer",
        verification_status: "phone",
        location: {
          city,
          region,
          country,
          label: [city, region].filter(Boolean).join(", ")
        }
      });

      if (error) {
        throw error;
      }

      toast({ title: "Профиль сохранен", description: "Можно управлять объявлениями и сделками." });
      router.push("/profile");
      router.refresh();
    } catch (error) {
      toast({
        title: "Не удалось сохранить",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setSaving(false);
    }
  }

  const previewUrl = avatarPreviewUrl || avatarUrl;

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Card className="bg-white/94 shadow-soft">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">Профиль</Badge>
          <CardTitle className="mt-2 text-2xl">Заполните данные профиля</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">Укажите имя, фото и ваш город, чтобы покупателям было проще вам доверять.</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загружаю профиль
            </div>
          ) : (
            <form className="grid gap-5" onSubmit={submit}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewUrl} />
                  <AvatarFallback>{displayName.slice(0, 2) || "P"}</AvatarFallback>
                </Avatar>
                <label className="flex min-h-24 flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-background p-4 text-center">
                  <UploadCloud className="h-6 w-6 text-primary" />
                  <span className="mt-2 text-sm font-semibold">Загрузить фото профиля</span>
                  <span className="text-xs text-muted-foreground">PNG или JPG</span>
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Имя
                  <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Email
                  <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                О себе
                <Textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Например: быстро отвечаю, бережно упаковываю технику, могу показать тесты устройства." />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2 text-sm font-medium">
                  Город
                  <Input value={city} onChange={(event) => setCity(event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Регион
                  <Input value={region} onChange={(event) => setRegion(event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Страна
                  <Input value={country} onChange={(event) => setCountry(event.target.value)} />
                </label>
              </div>
              <label className="flex items-start gap-3 rounded-lg border bg-card/60 p-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={acceptedPolicies}
                  onChange={(event) => setAcceptedPolicies(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border"
                />
                <span>
                  Подтверждаю согласие на обработку персональных данных и публикацию контактной информации в рамках сделок Pine.
                </span>
              </label>
              <Button disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Сохранить профиль
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
