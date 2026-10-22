import { TypeTable, type TypeNode } from 'fumadocs-ui/components/type-table';
import api from '@innostes/ui/api.json';

interface ApiProp {
  type: string;
  required: boolean;
  default: string | null;
  description: string;
}

const components = (
  api as {
    components: Record<
      string,
      { description: string; props: Record<string, ApiProp> }
    >;
  }
).components;

/** Renders inline `code` in TSDoc text. */
function renderText(text: string) {
  return text
    .split(/(`[^`]+`)/g)
    .map((part, i) =>
      part.startsWith('`') && part.endsWith('`') ? (
        <code key={i}>{part.slice(1, -1)}</code>
      ) : (
        part
      ),
    );
}

/**
 * Props tables generated from the TSDoc comments in `@innostes/ui` (via `dist/api.json`).
 * Lists only props declared by innostes UI; `baseUi` links to the Base UI part whose props
 * are also accepted.
 */
export function ApiTable({
  components: names,
  baseUi,
}: {
  /** Component names, e.g. `['Dialog', 'DialogContent']`. */
  components: string[];
  /** Base UI component docs slug, e.g. "dialog", when the parts extend Base UI. */
  baseUi?: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      {names.map((name) => {
        const doc = components[name];
        if (!doc)
          throw new Error(
            `No API docs for "${name}". Is it exported from @innostes/ui?`,
          );
        const entries = Object.entries(doc.props);
        const type: Record<string, TypeNode> = Object.fromEntries(
          entries.map(([prop, info]) => [
            prop,
            {
              type: info.type,
              required: info.required,
              default: info.default ?? undefined,
              description: info.description ? (
                <>{renderText(info.description)}</>
              ) : undefined,
            },
          ]),
        );
        return (
          <section key={name}>
            <h3
              id={`api-${name.toLowerCase()}`}
              className="mb-1 font-mono text-base"
            >
              {name}
            </h3>
            {doc.description && (
              <p className="mt-0 text-sm text-fd-muted-foreground">
                {renderText(
                  doc.description.split('\n\n')[0]!.replace(/\n/g, ' '),
                )}
              </p>
            )}
            {entries.length > 0 ? (
              <TypeTable type={type} />
            ) : (
              <p className="text-sm text-fd-muted-foreground">
                No props of its own.
              </p>
            )}
          </section>
        );
      })}
      {baseUi && (
        <p className="text-sm text-fd-muted-foreground">
          Every part also accepts the props of its{' '}
          <a
            href={`https://base-ui.com/react/components/${baseUi}#api-reference`}
            target="_blank"
            rel="noreferrer"
          >
            Base UI {baseUi.replace(/-/g, ' ')}
          </a>{' '}
          counterpart (e.g. <code>open</code>, <code>onOpenChange</code>,{' '}
          <code>disabled</code>, <code>render</code>) and all native HTML
          attributes.
        </p>
      )}
    </div>
  );
}
