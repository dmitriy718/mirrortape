import { renderToReadableStream } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./App";
export { publicPages } from "./content/catalog";
export { posts } from "./content/posts";
export async function renderPage(path: string): Promise<string> {
  let failure: unknown;
  const stream = await renderToReadableStream(
    <StaticRouter location={path}>
      <App />
    </StaticRouter>,
    {
      signal: AbortSignal.timeout(10000),
      onError(error) {
        failure = error;
      },
    },
  );
  await stream.allReady;
  if (failure) throw failure;
  return new Response(stream).text();
}
