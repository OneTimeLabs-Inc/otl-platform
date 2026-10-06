import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, CalendarDays, Clock3, MapPin, MessageCircle, Phone, Quote, Star, Wrench } from "lucide-react";
import { defaultPhotography, type BusinessSite } from "@/lib/business-site/data";

function cssVars(site: BusinessSite): CSSProperties {
  const p = site.layout.config?.palette ?? {};
  return {
    "--biz-bg": p.background || "#fbf8f0",
    "--biz-surface": p.surface || "#fffdf8",
    "--biz-text": p.text || "#0b1b28",
    "--biz-muted": p.muted || "#56616a",
    "--biz-accent": p.accent || "#ef252e",
    "--biz-accent2": p.accent2 || "#dce7ed",
    "--biz-radius": site.layout.config?.radius || "8px",
  } as CSSProperties;
}

function img(site: BusinessSite, kind: "hero" | "gallery" | "portfolio", index = 0) {
  const rows = site.media.filter(item => item.kind === kind || (kind === "gallery" && item.kind === "placeholder"));
  if (rows[index]) return rows[index];
  if (kind === "hero") {
    const stock = defaultPhotography[site.instance.business_type];
    return { id: "stock", public_url: stock.url, alt_text: site.instance.business_name, caption: "", source_name: stock.source, source_url: stock.sourceUrl, sort_order: 0, kind: "hero" as const };
  }
  return null;
}

function Brand({ site, light = false }: { site: BusinessSite; light?: boolean }) {
  const logo = site.media.find(item => item.kind === "logo");
  return <Link className={`lbg-brand ${light ? "light" : ""}`} href={`/${site.instance.path_slug}`}>
    {logo ? <span className="lbg-logo"><Image src={logo.public_url} alt={logo.alt_text || site.instance.business_name} fill sizes="54px" /></span> : <span className="lbg-mark">{site.instance.business_name.slice(0, 2).toUpperCase()}</span>}
    <span><strong>{site.instance.business_name}</strong><small>{site.instance.business_type.replaceAll("_", " ")}</small></span>
  </Link>;
}

function ContactStrip({ site }: { site: BusinessSite }) {
  return <div className="contact-strip">
    {site.content.phone && <a href={`tel:${site.content.phone.replace(/[^+\d]/g, "")}`}><Phone size={15}/><span>{site.content.phone}</span></a>}
    {site.content.hours_text && <span><Clock3 size={15}/>{site.content.hours_text}</span>}
    {site.content.address_text && <span><MapPin size={15}/>{site.content.address_text}</span>}
  </div>;
}

function Footer({ site, preview }: { site: BusinessSite; preview: boolean }) {
  return <footer className="site-footer"><strong>{site.instance.business_name}</strong><span>{preview ? <>OneTime Labs design demo · <Link href="/layouts">Back to gallery</Link></> : <>Site powered by OneTime Labs · <Link href={`/${site.instance.path_slug}/admin`}>Admin</Link></>}</span></footer>;
}

function LocalService({ site, preview }: { site: BusinessSite; preview: boolean }) {
  const hero = img(site, "hero")!;
  const phoneHref = site.content.phone ? `tel:${site.content.phone.replace(/[^+\d]/g, "")}` : "#services";
  return <main className="site local-service">
    <header className="local-top">
      <Brand site={site}/>
      <nav className="local-nav-info">
        <a href="#services">Services</a>
        {site.content.hours_text && <span><Clock3 size={14}/>{site.content.hours_text}</span>}
        {site.content.address_text && <span><MapPin size={14}/>{site.content.address_text}</span>}
        {site.content.contact_email && <a href={`mailto:${site.content.contact_email}`}>Contact</a>}
        {site.content.phone && <a className="local-call" href={phoneHref}><Phone size={14}/>{site.content.phone}</a>}
      </nav>
    </header>
    <div className="local-home">
      <section className="local-hero" style={{ backgroundImage:`url(${hero.public_url})` }}>
        <div className="local-shade"><div className="local-copy"><h1>{site.content.headline}</h1><p>{site.content.subheadline}</p><div className="local-actions"><a className="cta primary" href={site.content.primary_cta_href}><CalendarDays size={18}/>{site.content.primary_cta_label}<ArrowRight size={16}/></a><a className="cta ghost" href={phoneHref}><Phone size={18}/>Call the Shop</a></div></div></div>
      </section>
      <aside id="services" className="local-services"><div className="section-line"><h2>Services & Pricing</h2><span>What we do</span></div><div className="local-service-grid">{site.content.services.slice(0,6).map((s,i)=><article key={s.name}><Wrench size={19}/><span>{s.name}</span><b>{i===0?"Start here":"Learn more"}</b><small>{s.description}</small></article>)}</div><div className="local-info"><b>Appointment-based service</b><span>Clear estimates before work begins.</span></div></aside>
    </div>
    <Footer site={site} preview={preview}/>
  </main>;
}

function PerformanceShop({ site, preview }: { site: BusinessSite; preview: boolean }) {
  const hero = img(site,"hero")!; const gallery = img(site,"gallery");
  return <main className="site performance-shop">
    <section className="perf-hero" style={{ backgroundImage:`url(${hero.public_url})` }}><div className="perf-overlay"><header><Brand site={site} light/><nav><a href="#capabilities">Capabilities</a><a href="#shop">The Shop</a><a href="#contact">Book</a></nav></header><div className="perf-copy"><span>PERFORMANCE / REPAIR / FABRICATION</span><h1>{site.content.headline}</h1><p>{site.content.subheadline}</p><a className="perf-button" href="#contact">{site.content.primary_cta_label}<ArrowRight/></a></div><div className="perf-number">01</div></div></section>
    <section id="capabilities" className="perf-services">{site.content.services.slice(0,3).map((s,i)=><article key={s.name}><span>0{i+1}</span><h2>{s.name}</h2><p>{s.description}</p></article>)}</section>
    <section id="shop" className="perf-story"><div><span>THE SHOP</span><h2>Built around the machine, not the waiting room.</h2><p>{site.content.about_text}</p></div>{gallery&&<figure><Image src={gallery.public_url} alt={gallery.alt_text} fill sizes="50vw"/></figure>}</section>
    <section id="contact" className="perf-contact"><div><h2>Bring us the problem.</h2><p>We’ll tell you what it takes.</p></div><ContactStrip site={site}/></section><Footer site={site} preview={preview}/>
  </main>;
}

function EditorialStudio({ site, preview }: { site: BusinessSite; preview: boolean }) {
  const hero=img(site,"hero")!; const work=img(site,"portfolio") || img(site,"gallery");
  return <main className="site editorial-studio">
    <header className="editorial-nav"><Brand site={site}/><nav><a href="#services">Services</a><a href="#story">Studio</a><a href="#work">Work</a><a className="book" href="#contact">Book</a></nav></header>
    <section className="editorial-hero"><div className="editorial-title"><span>INDEPENDENT HAIR STUDIO</span><h1>{site.content.headline}</h1><p>{site.content.subheadline}</p></div><figure><Image src={hero.public_url} alt={hero.alt_text} fill priority sizes="52vw"/></figure></section>
    <section id="services" className="editorial-services"><div className="editorial-rule"><span>Services</span><span>01—03</span></div>{site.content.services.slice(0,3).map((s,i)=><article key={s.name}><span>0{i+1}</span><h2>{s.name}</h2><p>{s.description}</p><ArrowRight/></article>)}</section>
    <section id="story" className="editorial-story"><div><span>THE STUDIO</span><h2>Quiet space. Considered work.</h2></div><p>{site.content.about_text}</p></section>
    {work&&<section id="work" className="editorial-work"><figure><Image src={work.public_url} alt={work.alt_text} fill sizes="60vw"/></figure><div><span>SELECTED WORK</span><h2>{work.caption || "Recent work"}</h2><a href="#contact">Book an appointment <ArrowRight size={16}/></a></div></section>}
    <section id="contact" className="editorial-contact"><h2>{site.content.primary_cta_label}</h2><ContactStrip site={site}/></section><Footer site={site} preview={preview}/>
  </main>;
}

function Hospitality({ site, preview }: { site: BusinessSite; preview: boolean }) {
  const hero=img(site,"hero")!; const photos=site.media.filter(m=>m.kind==="gallery");
  return <main className="site hospitality-site"><header className="hospitality-nav"><Brand site={site}/><nav><a href="#menu">Menu</a><a href="#story">About</a><a href="#visit">Visit</a></nav><a className="reserve" href="#visit">Reserve</a></header>
    <section className="hospitality-hero"><figure><Image src={hero.public_url} alt={hero.alt_text} fill priority sizes="100vw"/></figure><div className="hospitality-copy"><span>DINNER · DRINKS · RACINE</span><h1>{site.content.headline}</h1><p>{site.content.subheadline}</p><a href="#visit">{site.content.primary_cta_label}</a></div></section>
    <section id="menu" className="menu-preview"><div><span>TONIGHT</span><h2>A short menu that changes with the room.</h2></div><div className="menu-list">{site.content.services.slice(0,3).map((s,i)=><div key={s.name}><span>0{i+1}</span><h3>{s.name}</h3><p>{s.description}</p></div>)}</div></section>
    {photos[0]&&<section className="hospitality-photo-row">{photos.slice(0,2).map(p=><figure key={p.id}><Image src={p.public_url} alt={p.alt_text} fill sizes="50vw"/><figcaption>{p.caption}</figcaption></figure>)}</section>}
    <section id="story" className="hospitality-story"><span>OUR ROOM</span><h2>Come for dinner. Stay because nobody is rushing you out.</h2><p>{site.content.about_text}</p></section>
    <section id="visit" className="hospitality-visit"><div><span>VISIT</span><h2>{site.instance.business_name}</h2></div><ContactStrip site={site}/></section><Footer site={site} preview={preview}/>
  </main>;
}

function ClassicBarber({ site, preview }: { site: BusinessSite; preview: boolean }) {
  const hero=img(site,"hero")!; const work=img(site,"portfolio");
  return <main className="site classic-barber"><div className="barber-banner">EST. 2026 · RACINE, WISCONSIN · GOOD CUTS, NO NONSENSE</div><header className="barber-nav"><Brand site={site}/><nav><a href="#services">Services</a><a href="#shop">Shop</a><a href="#contact">Book</a></nav></header>
    <section className="barber-hero"><div className="barber-copy"><span>YOUR NEIGHBORHOOD BARBER</span><h1>{site.content.headline}</h1><p>{site.content.subheadline}</p><a href="#contact">{site.content.primary_cta_label}<ArrowRight size={17}/></a></div><figure><Image src={hero.public_url} alt={hero.alt_text} fill priority sizes="52vw"/></figure></section>
    <section id="services" className="barber-services"><h2>On the chair</h2>{site.content.services.slice(0,3).map((s,i)=><article key={s.name}><span>0{i+1}</span><div><h3>{s.name}</h3><p>{s.description}</p></div><strong>Book →</strong></article>)}</section>
    <section id="shop" className="barber-story">{work&&<figure><Image src={work.public_url} alt={work.alt_text} fill sizes="45vw"/></figure>}<div><span>THE SHOP</span><h2>Know your barber. Know your cut.</h2><p>{site.content.about_text}</p></div></section>
    <section id="contact" className="barber-contact"><h2>Grab a chair.</h2><ContactStrip site={site}/></section><Footer site={site} preview={preview}/>
  </main>;
}

function ModernService({ site, preview }: { site: BusinessSite; preview: boolean }) {
  const hero=img(site,"hero")!; const gallery=site.media.filter(m=>m.kind==="gallery");
  return <main className="site modern-retail"><header className="retail-nav"><Brand site={site}/><nav><a href="#services">Services</a><a href="#booking">Appointments</a><a href="#visit">Contact</a></nav></header>
    <section id="services" className="retail-categories retail-categories-top">{site.content.services.slice(0,3).map((s,i)=><article key={s.name}><span>0{i+1}</span><h2>{s.name}</h2><p>{s.description}</p></article>)}</section>
    <section className="retail-grid retail-service-grid"><div className="retail-title retail-service-title"><span>APPOINTMENT-BASED SERVICE</span><h1>{site.content.headline}</h1><p>{site.content.subheadline}</p><a href="#booking">{site.content.primary_cta_label}<ArrowRight size={17}/></a></div><figure className="retail-main"><Image src={hero.public_url} alt={hero.alt_text} fill priority sizes="52vw"/></figure>{gallery[0]&&<figure className="retail-small"><Image src={gallery[0].public_url} alt={gallery[0].alt_text} fill sizes="34vw"/></figure>}</section>
    <section id="booking" className="retail-booking"><div><span>BOOKING</span><h2>Choose a service and reserve a time.</h2></div><a href={site.content.primary_cta_href}>{site.content.primary_cta_label}<ArrowRight size={17}/></a></section>
    <section id="visit" className="retail-visit"><h2>Appointments & contact</h2><ContactStrip site={site}/></section><Footer site={site} preview={preview}/>
  </main>;
}

function LuxuryNoir({ site, preview }: { site: BusinessSite; preview: boolean }) {
  const hero=img(site,"hero")!; const gallery=img(site,"gallery");
  return <main className="site luxury-noir"><section className="noir-hero" style={{backgroundImage:`url(${hero.public_url})`}}><div className="noir-overlay"><header><Brand site={site} light/><nav><a href="#experience">Experience</a><a href="#room">The Room</a><a href="#reserve">Reserve</a></nav></header><div className="noir-title"><span>NO. 8 · CHICAGO</span><h1>{site.content.headline}</h1><p>{site.content.subheadline}</p><a href="#reserve">{site.content.primary_cta_label}</a></div></div></section>
    <section id="experience" className="noir-services"><div><span>THE EVENING</span><h2>Less noise. More attention.</h2></div><div>{site.content.services.slice(0,3).map((s,i)=><article key={s.name}><span>0{i+1}</span><h3>{s.name}</h3><p>{s.description}</p></article>)}</div></section>
    <section id="room" className="noir-story">{gallery&&<figure><Image src={gallery.public_url} alt={gallery.alt_text} fill sizes="52vw"/></figure>}<div><span>THE ROOM</span><h2>Designed for an evening, not a turnover.</h2><p>{site.content.about_text}</p></div></section>
    <section className="noir-quote">{site.content.testimonials[0]&&<><Quote/><blockquote>“{site.content.testimonials[0].quote}”</blockquote><cite>{site.content.testimonials[0].name}</cite></>}</section>
    <section id="reserve" className="noir-contact"><h2>Reserve the evening.</h2><ContactStrip site={site}/></section><Footer site={site} preview={preview}/>
  </main>;
}

const renderers: Record<string,(props:{site:BusinessSite;preview:boolean})=>ReactNode> = {
  "clean-service": LocalService,
  "workshop-dark": PerformanceShop,
  "editorial-studio": EditorialStudio,
  "hospitality-warm": Hospitality,
  "neighborhood-classic": ClassicBarber,
  "modern-grid": ModernService,
  "luxury-noir": LuxuryNoir,
};

export default function BusinessSiteView({ site, preview = false }: { site: BusinessSite; preview?: boolean }) {
  const Renderer = renderers[site.layout.style_key] || LocalService;
  return <div className={`business-site-shell layout-${site.layout.style_key}`} style={cssVars(site)}><Renderer site={site} preview={preview}/></div>;
}
