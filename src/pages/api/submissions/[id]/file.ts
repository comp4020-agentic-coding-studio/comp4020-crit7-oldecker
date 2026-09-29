import type { APIRoute } from "astro";
import { getSubmissionById } from "../../../../lib/db";

export const GET: APIRoute = ({ params }) => {
  const id = Number(params.id);
  const submission = Number.isInteger(id) ? getSubmissionById(id) : undefined;
  if (!submission || !submission.fileData) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(submission.fileData), {
    headers: {
      "content-type": submission.fileType ?? "application/octet-stream",
      "content-disposition": `attachment; filename="${submission.fileName ?? "submission"}"`,
    },
  });
};
