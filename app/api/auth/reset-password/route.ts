import { passwordResetService } from "@/lib/auth/password-reset-service";
import { passwordResetSchema } from "@/lib/validators/id-auth";

export const dynamic = "force-dynamic";

function jsonResponse(body: object, status: number) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return jsonResponse({ error: "Content type must be application/json." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (contentLength > 8_192) {
    return jsonResponse({ error: "Request is too large." }, 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request." }, 400);
  }

  const parsed = passwordResetSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      {
        error:
          parsed.error.issues[0]?.message ?? "Please check the password fields.",
      },
      400,
    );
  }

  try {
    const consumed = await passwordResetService.consume(
      parsed.data.token,
      parsed.data.newPassword,
    );

    if (!consumed) {
      return jsonResponse(
        { error: "This reset link is invalid, expired, or already used." },
        400,
      );
    }

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    console.error("[password-reset] could not replace password:", error);
    return jsonResponse(
      { error: "Password recovery is temporarily unavailable." },
      503,
    );
  }
}
