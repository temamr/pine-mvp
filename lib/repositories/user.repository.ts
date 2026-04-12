import type { AsyncResult, ID, User } from "@/lib/domain";

export type UserRepository = {
  current(): AsyncResult<User>;
  byId(userId: ID): AsyncResult<User | null>;
};
