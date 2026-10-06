import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  Coffee,
  Gavel,
  Image as ImageIcon,
  MessageSquareText,
  PackageCheck,
  Palette,
  RefreshCw,
  Rocket,
  Scissors,
  Store,
  Upload,
  ExternalLink,
  UserCog,
  UsersRound,
  Wrench,
} from "lucide-react";

import { launchBusiness, listBusinessInstances } from "../../services/businessLaunch";
import { listSiteLayouts, uploadSiteLayout } from "../../services/siteLayouts";
import type {
  ApplicationTemplate,
  BusinessInstance,
  BusinessType,
  LaunchModule,
} from "../../types/businessLaunch";
import type { SiteLayout, UploadedLayoutManifest } from "../../types/siteLayouts";
import "./LaunchConsole.css";

type Template = {
  type: BusinessType;
  name: string;
  description: string;
  icon: typeof Store;
  modules: LaunchModule[];
};

const applicationTemplates: Array<{
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}> = [
  {
    id: "smb_operations",
    name: "SMB Scheduling & Operations",
    description: "Workforce scheduling, shift operations, customers and business administration.",
    enabled: true,
  },
  {
    id: "appointments_booking",
    name: "Appointments & Booking",
    description: "Appointment-led businesses with staff, customer and resource scheduling. Planned template.",
    enabled: false,
  },
  {
    id: "service_work_orders",
    name: "Service & Work Orders",
    description: "Service businesses that operate around jobs, work orders, resources and customers. Planned template.",
    enabled: false,
  },
];

const coreModules: LaunchModule[] = [
  "scheduling",
  "time_clock",
  "shift_bids",
  "open_shifts",
  "shift_swaps",
  "availability",
  "pto",
  "messaging",
  "tasks",
  "labor_budget",
  "reporting",
];

const templates: Template[] = [
  {
    type: "retail",
    name: "Retail Store",
    description: "Hourly scheduling, store coverage, open shifts, shift bids and team operations.",
    icon: Store,
    modules: [...coreModules, "inventory", "customers"],
  },
  {
    type: "restaurant_bar",
    name: "Restaurant / Bar",
    description: "FOH/BOH scheduling, call-outs, shift bids and opening/closing work.",
    icon: Coffee,
    modules: [...coreModules, "customers", "resources"],
  },
  {
    type: "barber_salon",
    name: "Barber / Salon",
    description: "Staff schedules plus appointments, chairs/resources, client records and work portfolio.",
    icon: Scissors,
    modules: [...coreModules, "appointments", "resources", "customers"],
  },
  {
    type: "auto_repair",
    name: "Auto Repair",
    description: "Technician scheduling, bays, appointments, work orders and parts.",
    icon: Car,
    modules: [...coreModules, "appointments", "resources", "customers", "work_orders", "inventory", "estimates"],
  },
];

const moduleLabels: Record<LaunchModule, string> = {
  scheduling: "Scheduling",
  time_clock: "Time Clock",
  shift_bids: "Shift Bids",
  open_shifts: "Open Shifts",
  shift_swaps: "Shift Swaps",
  availability: "Availability Rules",
  pto: "PTO / Time Off",
  messaging: "Team Messaging",
  tasks: "Tasks / Checklists",
  labor_budget: "Labor Budget Controls",
  appointments: "Appointments",
  resources: "Resources / Chairs / Bays",
  customers: "Customer Records",
  work_orders: "Work Orders",
  inventory: "Inventory",
  estimates: "Estimates",
  reporting: "Reporting",
};

const moduleIcons: Partial<Record<LaunchModule, typeof Store>> = {
  scheduling: CalendarDays,
  time_clock: Clock3,
  shift_bids: Gavel,
  messaging: MessageSquareText,
  inventory: PackageCheck,
  customers: UsersRound,
  work_orders: Wrench,
  estimates: BadgeDollarSign,
};

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 45);
}

function palette(layout: SiteLayout): string[] {
  const p = layout.config?.palette ?? {};
  return [p.background, p.surface, p.text, p.accent, p.accent2].filter((value): value is string => Boolean(value));
}

export default function LaunchConsole() {
  const [applicationTemplate, setApplicationTemplate] = useState<ApplicationTemplate>("smb_operations");
  const [businessType, setBusinessType] = useState<BusinessType>("retail");
  const [businessName, setBusinessName] = useState("");
  const [pathSlug, setPathSlug] = useState("");
  const [modules, setModules] = useState<LaunchModule[]>(templates[0].modules);
  const [adminEmail, setAdminEmail] = useState("iekhanine@gmail.com");
  const [instances, setInstances] = useState<BusinessInstance[]>([]);
  const [layouts, setLayouts] = useState<SiteLayout[]>([]);
  const [siteLayoutCode, setSiteLayoutCode] = useState("clean-service");
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dryRun, setDryRun] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [layoutManifest, setLayoutManifest] = useState<UploadedLayoutManifest | null>(null);
  const [layoutFileName, setLayoutFileName] = useState("");
  const [layoutBusinessTypes, setLayoutBusinessTypes] = useState<BusinessType[]>(["retail"]);
  const [uploadingLayout, setUploadingLayout] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find(item => item.type === businessType) ?? templates[0],
    [businessType],
  );

  const compatibleLayouts = useMemo(
    () => layouts.filter(layout => layout.supported_business_types.includes(businessType)),
    [layouts, businessType],
  );

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [nextInstances, nextLayouts] = await Promise.all([listBusinessInstances(), listSiteLayouts()]);
      setInstances(nextInstances);
      setLayouts(nextLayouts);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load launch data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    if (!compatibleLayouts.some(layout => layout.code === siteLayoutCode)) {
      setSiteLayoutCode(compatibleLayouts[0]?.code ?? "clean-service");
    }
  }, [businessType, compatibleLayouts, siteLayoutCode]);

  function chooseTemplate(template: Template) {
    setBusinessType(template.type);
    setModules(template.modules);
    setMessage(null);
    setError(null);
  }

  function updateBusinessName(value: string) {
    setBusinessName(value);
    if (!pathSlug || pathSlug === slugify(businessName)) setPathSlug(slugify(value));
  }

  function toggleModule(module: LaunchModule) {
    setModules(current => current.includes(module) ? current.filter(item => item !== module) : [...current, module]);
  }

  function toggleLayoutBusinessType(type: BusinessType) {
    setLayoutBusinessTypes(current => current.includes(type) ? current.filter(item => item !== type) : [...current, type]);
  }

  async function readLayoutFile(file: File | undefined) {
    if (!file) return;
    setLayoutFileName(file.name);
    setError(null);
    try {
      const manifest = JSON.parse(await file.text()) as UploadedLayoutManifest;
      if (!manifest?.name || !manifest?.config) throw new Error("Layout manifest must include name and config.");
      setLayoutManifest(manifest);
    } catch (fileError) {
      setLayoutManifest(null);
      setError(fileError instanceof Error ? fileError.message : "Unable to read layout manifest.");
    }
  }

  async function submitLayoutUpload() {
    if (!layoutManifest) return setError("Choose a valid layout JSON manifest first.");
    if (!layoutBusinessTypes.length) return setError("Choose at least one business type for this layout.");
    setUploadingLayout(true);
    setError(null);
    try {
      const created = await uploadSiteLayout(layoutManifest, layoutBusinessTypes);
      setLayouts(current => [...current, created]);
      if (created.supported_business_types.includes(businessType)) setSiteLayoutCode(created.code);
      setMessage(`${created.name} was added to the layout library.`);
      setShowUpload(false);
      setLayoutManifest(null);
      setLayoutFileName("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload layout.");
    } finally {
      setUploadingLayout(false);
    }
  }

  async function submitLaunch() {
    setMessage(null);
    setError(null);
    if (!businessName.trim()) return setError("Enter a business name.");
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(pathSlug)) return setError("Path must use lowercase letters, numbers, and hyphens only.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) return setError("Enter a valid initial admin email.");
    if (!siteLayoutCode) return setError("Choose a site layout.");

    setLaunching(true);
    try {
      const result = await launchBusiness({
        businessName: businessName.trim(),
        pathSlug,
        businessType,
        applicationTemplate,
        siteLayoutCode,
        modules,
        adminEmail: adminEmail.trim(),
        dryRun,
      });
      setMessage(dryRun
        ? `Preview record created for ${result.instance.public_url}. No live path was published.`
        : `${result.instance.business_name} launched at ${result.instance.public_url}. The /${pathSlug} path remains its permanent fallback.`);
      await refresh();
    } catch (launchError) {
      setError(launchError instanceof Error ? launchError.message : "Launch failed.");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="launch-console page">
      <div className="page-header">
        <div className="page-title">
          <h1>Launch Console</h1>
          <span>Launch the permanent OTL path now. Add subdomains and custom domains later without moving the tenant.</span>
        </div>
        <button className="launch-secondary" onClick={() => void refresh()} disabled={loading}><RefreshCw size={16} /> Refresh</button>
      </div>

      {error && <div className="launch-alert error">{error}</div>}
      {message && <div className="launch-alert success">{message}</div>}

      <section className="panel">
        <div className="panel-header">1 · Application Template</div>
        <div className="panel-body launch-form-grid">
          <label className="launch-span-2">
            Application template
            <select value={applicationTemplate} onChange={event => setApplicationTemplate(event.target.value as ApplicationTemplate)}>
              {applicationTemplates.map(template => (
                <option key={template.id} value={template.id} disabled={!template.enabled}>{template.name}{template.enabled ? "" : " — Coming soon"}</option>
              ))}
            </select>
            <small>{applicationTemplates.find(template => template.id === applicationTemplate)?.description}</small>
          </label>
        </div>
      </section>

      <div className="launch-columns">
        <section className="panel">
          <div className="panel-header">2 · Business Type</div>
          <div className="panel-body launch-template-grid">
            {templates.map(template => {
              const Icon = template.icon;
              return (
                <button key={template.type} type="button" className={`launch-template ${businessType === template.type ? "selected" : ""}`} onClick={() => chooseTemplate(template)}>
                  <Icon size={22} /><strong>{template.name}</strong><span>{template.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">3 · Instance Details</div>
          <div className="panel-body launch-form-grid">
            <label>Business name<input value={businessName} onChange={event => updateBusinessName(event.target.value)} placeholder="North Star Auto Repair" /></label>
            <label>Permanent OTL path<div className="launch-path-row"><span>onetimelabs.net/</span><input value={pathSlug} onChange={event => setPathSlug(slugify(event.target.value))} placeholder="northstar" /></div><small>This path stays active even after a subdomain or custom domain is added.</small></label>
            <label><span className="launch-label-icon"><UserCog size={14} /> Initial admin account</span><input type="email" value={adminEmail} onChange={event => setAdminEmail(event.target.value)} placeholder="customer@example.com" /><small>This user manages site content, images and portfolio from the customer admin.</small></label>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header launch-panel-header-row"><span>4 · Full Site Design</span><div className="launch-layout-header-actions"><a className="launch-secondary" href="https://onetimelabs.net/layouts" target="_blank" rel="noreferrer"><ExternalLink size={15} /> View Demo Gallery</a><button type="button" className="launch-secondary" onClick={() => setShowUpload(value => !value)}><Upload size={15} /> Upload Layout</button></div></div>
        <div className="panel-body">
          <div className="launch-layout-grid">
            {compatibleLayouts.map(layout => {
              const colors = palette(layout);
              return (
                <div key={layout.code} className={`launch-layout-card ${siteLayoutCode === layout.code ? "selected" : ""}`}>
                  <button type="button" className="launch-layout-select" onClick={() => setSiteLayoutCode(layout.code)}>
                    <div className={`launch-layout-preview layout-preview-${layout.style_key}`}>
                      <div className="layout-preview-nav" />
                      <div className="layout-preview-hero"><i /><i /></div>
                      <div className="layout-preview-cards"><i /><i /><i /></div>
                    </div>
                    <div className="launch-layout-copy">
                      <div><Palette size={16} /><strong>{layout.name}</strong>{!layout.is_system && <em>Custom</em>}</div>
                      <span>{layout.description}</span>
                      <div className="launch-color-row">{colors.map(color => <i key={color} style={{ background: color }} title={color} />)}</div>
                    </div>
                  </button>
                  {layout.is_system && <a className="launch-layout-demo-link" href={`https://onetimelabs.net/layouts/${layout.code}`} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Open full sample</a>}
                </div>
              );
            })}
          </div>

          {showUpload && (
            <div className="launch-upload-layout">
              <div>
                <ImageIcon size={22} />
                <div><strong>Add a reusable layout</strong><span>Upload a JSON layout manifest, then choose which business types can use it. The renderer applies the full palette, hero treatment, card system, navigation style and typography.</span></div>
              </div>
              <label className="launch-file-picker">Layout JSON<input type="file" accept="application/json,.json" onChange={event => void readLayoutFile(event.target.files?.[0])} /><small>{layoutFileName || "No file selected"}</small></label>
              <div className="launch-business-type-picks">
                {templates.map(template => <label key={template.type}><input type="checkbox" checked={layoutBusinessTypes.includes(template.type)} onChange={() => toggleLayoutBusinessType(template.type)} />{template.name}</label>)}
              </div>
              {layoutManifest && <div className="launch-manifest-ready"><CheckCircle2 size={16} /> {layoutManifest.name} is ready to import.</div>}
              <button type="button" className="launch-primary" disabled={uploadingLayout || !layoutManifest} onClick={() => void submitLayoutUpload()}>{uploadingLayout ? "Adding layout..." : "Add Layout to Library"}</button>
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">5 · Enabled Modules · {selectedTemplate.name}</div>
        <div className="panel-body launch-module-grid">
          {(Object.keys(moduleLabels) as LaunchModule[]).map(module => {
            const Icon = moduleIcons[module] ?? CheckCircle2;
            const active = modules.includes(module);
            return <label key={module} className={`launch-module ${active ? "active" : ""}`}><input type="checkbox" checked={active} onChange={() => toggleModule(module)} /><Icon size={17} /><span>{moduleLabels[module]}</span></label>;
          })}
        </div>
        <div className="launch-module-note">Branding, hero images, gallery/portfolio images, public contact details and labor budgets are configured inside the launched business's own admin area.</div>
      </section>

      <section className="panel">
        <div className="panel-header">6 · Provision</div>
        <div className="panel-body launch-provision">
          <div className="launch-provision-steps">
            <div><span>1</span><div><b>Create tenant + content</b><small>Business, layout, modules and initial administrator.</small></div></div>
            <div><span>2</span><div><b>Publish permanent path</b><small>Launch at onetimelabs.net/{pathSlug || "business"} immediately.</small></div></div>
            <div><span>3</span><div><b>Reserve matching hostname slug</b><small>{pathSlug || "business"}.onetimelabs.net stays available for the later Joker step.</small></div></div>
            <div><span>4</span><div><b>Customer admin manages presentation</b><small>Logo, hero, public copy, contact information, gallery and portfolio are managed there.</small></div></div>
            <div className="future-step"><span>5</span><div><b>Subdomain / custom domain later</b><small>Joker + Vercel routing gets layered on top. The /{pathSlug || "business"} fallback never disappears.</small></div></div>
          </div>
          <div className="launch-action-card">
            <label className="launch-dry-run"><input type="checkbox" checked={dryRun} onChange={event => setDryRun(event.target.checked)} /><span><b>Preview only</b><small>Create a draft record without publishing the path.</small></span></label>
            <div className="launch-url-preview">{pathSlug ? `https://onetimelabs.net/${pathSlug}` : "https://onetimelabs.net/business"}</div>
            <div className="launch-fallback-note"><CheckCircle2 size={15} /> Permanent fallback route retained when domains are added later.</div>
            <button className="launch-primary" onClick={() => void submitLaunch()} disabled={launching}><Rocket size={18} /> {launching ? "Launching..." : dryRun ? "Create Preview Record" : "Launch Path Site"}</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">Recent SMB Instances</div>
        <div className="panel-body launch-table-wrap">
          {loading ? <div className="launch-empty">Loading instances...</div> : instances.length === 0 ? <div className="launch-empty">No businesses have been provisioned yet.</div> : (
            <table className="table"><thead><tr><th>Business</th><th>Layout</th><th>Type</th><th>Permanent path</th><th>Domain</th><th>Admin</th><th>Status</th></tr></thead><tbody>{instances.map(instance => <tr key={instance.id}><td>{instance.business_name}</td><td>{layouts.find(layout => layout.code === instance.site_layout_code)?.name ?? instance.site_layout_code ?? "—"}</td><td>{instance.business_type.replaceAll("_", " ")}</td><td>{instance.public_url ?? `https://onetimelabs.net/${instance.path_slug ?? instance.subdomain}`}</td><td>{instance.custom_domain ?? (instance.subdomain_enabled ? `${instance.subdomain}.onetimelabs.net` : "Path only")}</td><td>{instance.admin_email ?? "—"}</td><td><span className={`launch-status ${instance.status}`}>{instance.status}</span></td></tr>)}</tbody></table>
          )}
        </div>
      </section>
    </div>
  );
}
