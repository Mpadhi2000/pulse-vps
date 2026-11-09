import type { Container } from "@/lib/types";
import { containerState } from "@/lib/format";
import { Badge } from "./Badge";
import { Icon } from "./Icons";

function Image({ image }: { image?: string }) {
  const img = String(image || "—");
  const idx = img.lastIndexOf(":");
  if (idx > -1 && idx > img.lastIndexOf("/")) {
    return <span className="image">{img.slice(0, idx)}<span className="tag">:{img.slice(idx + 1)}</span></span>;
  }
  return <span className="image">{img}</span>;
}

export function ContainersTable({ containers, newNames }: { containers: Container[] | null; newNames: Set<string> }) {
  const items = containers ? [...containers].sort((a, b) => String(a.name).localeCompare(String(b.name))) : null;

  return (
    <section className="panel" aria-label="Docker containers">
      <div className="panel-head">
        <Icon name="box" />
        <h3>Containers</h3>
        <span className="right">{items?.length ? `${items.length} discovered` : ""}</span>
      </div>
      <table>
        <thead><tr><th>Name</th><th>Status</th><th>Image</th></tr></thead>
        <tbody>
          {items === null ? (
            <tr><td colSpan={3} className="empty">Loading containers…</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={3} className="empty">No containers found</td></tr>
          ) : items.map((c) => {
            const name = String(c.name || "unnamed");
            const st = containerState(c.status, c.health);
            return (
              <tr key={name} className={newNames.has(name) ? "new" : ""}>
                <td className="c-name"><div className="ctr-name"><span className={`dot ${st.up ? "ok" : "crit"}`} />{name}</div></td>
                <td className="c-status" data-label="Status">
                  <div className="status-cell">
                    {st.up ? <Badge tone="ok">Up</Badge> : <Badge tone="crit">Down</Badge>}
                    {st.health === "healthy" && <Badge tone="info">Healthy</Badge>}
                    {st.health === "unhealthy" && <Badge tone="crit">Unhealthy</Badge>}
                    {st.health === "starting" && <Badge tone="warn">Starting</Badge>}
                    <span className="uptime">{st.uptime}</span>
                  </div>
                </td>
                <td className="c-image" data-label="Image"><Image image={c.image} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
