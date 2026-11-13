import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { allDemos, demoMinutes, demoPath, guide, type DemoRef, type Section } from './guide';
import {
  PERFIS, assuntoDescricao, assuntoNome, assuntoPerfil, guiaState, inProgress, normalize, thumbOf, type GuiaState,
} from './presentation';
import { useProgress, type DemoProgress } from './progress';

type Filtro = 'todos' | GuiaState;

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'empty', label: 'Não vistos' },
  { id: 'current', label: 'Em andamento' },
  { id: 'done', label: 'Concluídos' },
];

/** Central de guias: menu lateral de assuntos, busca e grade de guias. Sem `section`, mostra todos. */
export default function Central({ section }: { section?: Section }) {
  const progress = useProgress();
  const [params, setParams] = useSearchParams();
  const busca = params.get('busca') ?? '';
  const [filtro, setFiltro] = useState<Filtro>('todos');

  useEffect(() => {
    document.title = section ? `${assuntoNome(section)} · Guia Fidz` : 'Guia Fidz';
  }, [section]);

  // Trocar de assunto volta o filtro para "Todos".
  useEffect(() => setFiltro('todos'), [section]);

  const setBusca = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('busca', value); else next.delete('busca');
    setParams(next, { replace: true });
  };

  const termo = normalize(busca.trim());
  // Buscando, procura em todos os assuntos, não só no aberto.
  const base = useMemo(() => {
    if (termo) {
      return allDemos.filter((r) =>
        normalize(`${r.demo.title} ${r.demo.description ?? ''} ${assuntoNome(r.section)}`).includes(termo));
    }
    return section ? allDemos.filter((r) => r.section.id === section.id) : allDemos;
  }, [termo, section]);

  const counts = useMemo(() => {
    const c: Record<Filtro, number> = { todos: base.length, empty: 0, current: 0, done: 0 };
    for (const r of base) c[guiaState(progress[r.demo.id])]++;
    return c;
  }, [base, progress]);

  const visiveis = filtro === 'todos' ? base : base.filter((r) => guiaState(progress[r.demo.id]) === filtro);
  const continuar = inProgress(progress)[0];

  return (
    <div className="central">
      <header className="topbar">
        <Link to="/" className="topbar__brand" aria-label="Guia Fidz, início">
          <img src="/logo.png" alt="Fidz" />
          <span>Guia</span>
        </Link>
        <div className="search">
          <SearchIcon />
          <label htmlFor="busca" className="sr-only">Buscar nos guias</label>
          <input
            id="busca"
            type="search"
            placeholder={`Buscar nos ${allDemos.length} guias`}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <a className="topbar__link" href={guide.brand.cta.href} target="_blank" rel="noreferrer">Conhecer a Fidz</a>
      </header>

      <div className="central__body">
        <Sidebar progress={progress} />

        <main className="central__main">
          {continuar && (
            <div className="continuar">
              <span className="eyebrow">Continuar</span>
              <span className="continuar__text">
                <b>{continuar.demo.title}</b> · passo {progress[continuar.demo.id].step + 1} de {continuar.demo.steps.length + 1}
              </span>
              <Link className="btn btn--primary" to={`${demoPath(continuar)}?passo=${progress[continuar.demo.id].step + 1}`}>
                Continuar
              </Link>
            </div>
          )}

          <div className="central__head">
            {termo ? (
              <>
                <h1>Resultados para “{busca.trim()}”</h1>
                <p>
                  {base.length === 0
                    ? 'Nenhum guia encontrado. Tente outra palavra, como cupom, saldo ou cashback.'
                    : `${base.length} ${base.length === 1 ? 'guia encontrado' : 'guias encontrados'} em todos os assuntos.`}
                </p>
              </>
            ) : section ? (
              <>
                <nav className="crumbs" aria-label="Você está em">
                  <Link to="/">Todos os guias</Link> › {assuntoPerfil(section)}
                </nav>
                <h1>{assuntoNome(section)}</h1>
                {assuntoDescricao(section) && <p>{assuntoDescricao(section)}</p>}
              </>
            ) : (
              <>
                <h1>Todos os guias</h1>
                <p>Guias narrados, passo a passo, com as telas reais da Fidz. Escolha um assunto ao lado ou busque pelo que você quer fazer.</p>
              </>
            )}
          </div>

          {base.length > 0 && (
            <div className="filtros" role="group" aria-label="Filtrar guias">
              {FILTROS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`chip${filtro === f.id ? ' chip--on' : ''}`}
                  aria-pressed={filtro === f.id}
                  onClick={() => setFiltro(f.id)}
                >
                  {f.label} · {counts[f.id]}
                </button>
              ))}
            </div>
          )}

          {base.length > 0 && visiveis.length === 0 && (
            <p className="vazio">Nenhum guia neste filtro. <button type="button" className="btn btn--link" onClick={() => setFiltro('todos')}>Ver todos</button></p>
          )}

          {section || termo ? (
            <Grade refs={visiveis} progress={progress} />
          ) : (
            guide.sections.map((s) => {
              const refs = visiveis.filter((r) => r.section.id === s.id);
              if (!refs.length) return null;
              return (
                <section key={s.id} className="grupo" aria-labelledby={`grupo-${s.slug}`}>
                  <div className="grupo__head">
                    <h2 id={`grupo-${s.slug}`}>{assuntoNome(s)}</h2>
                    <Link to={`/${s.slug}`}>Abrir assunto ›</Link>
                  </div>
                  <Grade refs={refs} progress={progress} />
                </section>
              );
            })
          )}

          {section && !termo && <ProximoAssunto section={section} />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ progress }: { progress: Record<string, DemoProgress> }) {
  const done = allDemos.filter((r) => progress[r.demo.id]?.done).length;
  const pct = allDemos.length ? Math.round((done / allDemos.length) * 100) : 0;
  const ref = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // No celular o menu vira uma fileira que rola de lado: traz o assunto aberto para a vista.
  useEffect(() => {
    const nav = ref.current;
    const active = nav?.querySelector<HTMLElement>('.sidebar__item.active');
    if (nav && active && nav.scrollWidth > nav.clientWidth) {
      nav.scrollLeft = active.offsetLeft - nav.offsetLeft - 16;
    }
  }, [pathname]);

  return (
    <nav ref={ref} className="sidebar" aria-label="Assuntos">
      <div className="sidebar__progress">
        <span className="sidebar__progress-title">Seu progresso</span>
        <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Guias concluídos">
          <div className="progress__fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="sidebar__progress-count">{done} de {allDemos.length} guias concluídos</span>
      </div>

      <div className="sidebar__group">
        <NavLink to="/" end className="sidebar__item">
          <span>Todos os guias</span>
          <span className="sidebar__count">{allDemos.length}</span>
        </NavLink>
      </div>

      {PERFIS.map((perfil) => {
        const sections = guide.sections.filter((s) => assuntoPerfil(s) === perfil);
        if (!sections.length) return null;
        return (
          <div key={perfil} className="sidebar__group">
            <span className="eyebrow sidebar__label">{perfil}</span>
            {sections.map((s) => {
              const refs = allDemos.filter((r) => r.section.id === s.id);
              const feitos = refs.filter((r) => progress[r.demo.id]?.done).length;
              return (
                <NavLink key={s.id} to={`/${s.slug}`} className="sidebar__item">
                  <span>{assuntoNome(s)}</span>
                  <span className="sidebar__count">{feitos}/{refs.length}</span>
                </NavLink>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

function Grade({ refs, progress }: { refs: DemoRef[]; progress: Record<string, DemoProgress> }) {
  return (
    <div className="grade">
      {refs.map((ref) => {
        const p = progress[ref.demo.id];
        const state = guiaState(p);
        const thumb = thumbOf(ref.demo);
        const href = demoPath(ref) + (state === 'current' ? `?passo=${p.step + 1}` : '');
        return (
          <Link key={ref.demo.id} to={href} className="card">
            <div className="card__thumb">
              {thumb && <img src={thumb.src} alt="" loading="lazy" style={{ transformOrigin: `${thumb.x}% ${thumb.y}%` }} />}
            </div>
            <div className="card__body">
              <h3>{ref.demo.title}</h3>
              {ref.demo.description && <p>{ref.demo.description}</p>}
              <div className="card__foot">
                <span className="card__min">{demoMinutes(ref.demo)} min</span>
                {state === 'done' && <span className="pill pill--done">Concluído</span>}
                {state === 'current' && <span className="pill pill--current">Passo {p.step + 1} de {ref.demo.steps.length + 1}</span>}
                {state === 'empty' && <span className="pill">Não visto</span>}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ProximoAssunto({ section }: { section: Section }) {
  const i = guide.sections.findIndex((s) => s.id === section.id);
  const next = guide.sections[i + 1];
  if (!next) return null;
  return (
    <div className="proximo">
      <span>
        Terminou {assuntoNome(section)}? O próximo assunto é <b>{assuntoNome(next)}</b>
        {assuntoPerfil(next) !== assuntoPerfil(section) ? `, para ${assuntoPerfil(next) === 'Equipe do balcão' ? 'a sua equipe' : 'o dono da loja'}` : ''}.
      </span>
      <Link to={`/${next.slug}`}>Ir para {assuntoNome(next)} ›</Link>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
