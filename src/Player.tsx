import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FULL, focusRect, frame as frameView, placeTip, project, type Size } from './camera';
import { allDemos, coverImage, demoMinutes, demoPath, type Chapter, type DemoRef, type Step } from './guide';
import { assuntoNome, thumbOf } from './presentation';
import { saveProgress, useProgress } from './progress';

const SOUND_KEY = 'fidz-guide:sound';
const MOBILE_QUERY = '(max-width: 720px)';

function readSoundPref(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const on = () => setMatch(mql.matches);
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, [query]);
  return match;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Passo sintético de encerramento (a página pública do Supademo não exporta o outro). */
type Frame = { kind: 'step'; step: Step } | { kind: 'end' };

export default function Player({ demoRef }: { demoRef: DemoRef }) {
  const { demo, section } = demoRef;
  const frames: Frame[] = useMemo(
    () => [...demo.steps.map((step) => ({ kind: 'step' as const, step })), { kind: 'end' as const }],
    [demo],
  );
  const total = frames.length;
  const [params, setParams] = useSearchParams();
  const index = clamp(Number(params.get('passo') ?? 1) - 1, 0, total - 1);
  const frame = frames[index];
  const step = frame.kind === 'step' ? frame.step : null;
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const allProgress = useProgress();
  const progress = allProgress[demo.id];
  const doneCount = allDemos.filter((r) => allProgress[r.demo.id]?.done).length;

  const [soundOn, setSoundOn] = useState(readSoundPref);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const cover = coverImage(demo);

  const aspect = useMemo(() => {
    const s = demo.steps.find((x) => x.width && x.height);
    return s ? s.width! / s.height! : 16 / 9;
  }, [demo]);

  const goTo = useCallback(
    (i: number) => {
      const target = clamp(i, 0, total - 1);
      setParams(target === 0 ? {} : { passo: String(target + 1) }, { replace: true });
    },
    [setParams, total],
  );
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    document.title = `${demo.title} · Guia Fidz`;
  }, [demo.title]);

  // Guarda o progresso (a abertura não conta, para não apagar o "continuar")
  useEffect(() => {
    if (index > 0) saveProgress(demo.id, index, frame.kind === 'end');
  }, [demo.id, index, frame.kind]);

  // Narração do passo atual
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    if (!step?.audio || !soundOn) {
      setAudioBlocked(false);
      return;
    }
    audio.src = step.audio;
    audio.currentTime = 0;
    audio.play().then(
      () => setAudioBlocked(false),
      (err: DOMException) => setAudioBlocked(err.name === 'NotAllowedError'),
    );
  }, [step, soundOn]);

  // Pré-carrega a mídia do próximo passo
  useEffect(() => {
    const n = frames[index + 1];
    if (n?.kind === 'step' && n.step.image) new Image().src = n.step.image;
  }, [frames, index]);

  // Navegação por teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  const toggleSound = () => {
    setSoundOn((v) => {
      try {
        localStorage.setItem(SOUND_KEY, v ? 'off' : 'on');
      } catch { /* armazenamento indisponível */ }
      return !v;
    });
  };

  const unblockAudio = () => {
    audioRef.current?.play().then(() => setAudioBlocked(false), () => {});
  };

  const tipText = step?.hotspot?.text ?? null;
  const resumeAt = index === 0 && progress && !progress.done && progress.step > 1 ? progress.step : null;

  return (
    <div className="page player">
      <header className="site-header">
        <Link to="/" aria-label="Guia Fidz, início"><img src="/logo.png" alt="Fidz" /></Link>
        <Link to="/" className="site-header__progress" aria-label={`Ver todos os guias, ${doneCount} de ${allDemos.length} concluídos`}>
          <span className="progress" aria-hidden="true">
            <span className="progress__fill" style={{ width: `${(doneCount / allDemos.length) * 100}%` }} />
          </span>
          <span>{doneCount} de {allDemos.length} guias</span>
        </Link>
      </header>

      <div className="player__heading">
        <nav className="crumbs" aria-label="Você está em">
          <Link to="/">Guias</Link> / <Link to={`/${section.slug}`}>{assuntoNome(section)}</Link>
        </nav>
        <h1>{demo.title}</h1>
      </div>

      {frame.kind === 'end' ? (
        <EndScreen demoRef={demoRef} onReplay={() => goTo(0)} />
      ) : (
      <Stage
        frames={frames}
        index={index}
        aspect={aspect}
        isMobile={isMobile}
        onNext={goNext}
        onPrev={index > 0 ? goPrev : undefined}
      >
        {step?.chapter && (
          <ChapterScreen
            chapter={step.chapter}
            backdrop={cover}
            resumeAt={resumeAt}
            total={total}
            onResume={() => resumeAt && goTo(resumeAt)}
            onInternal={(stepId) => {
              const i = frames.findIndex((f) => f.kind === 'step' && f.step.id === stepId);
              goTo(i >= 0 ? i : index + 1);
            }}
          />
        )}

        {step?.video && (
          <button className="stage__skip" onClick={goNext}>Pular ›</button>
        )}

        {audioBlocked && (
          <button className="stage__audio" onClick={unblockAudio}>
            <SoundOnIcon /> Ouvir narração
          </button>
        )}
      </Stage>
      )}

      {/* No celular o texto vai abaixo do palco, para não cobrir a interface */}
      {isMobile && tipText && (
        <div className="tip-mobile" aria-live="polite">
          <p>{tipText}</p>
        </div>
      )}

      <div className="controls">
        <button className="btn btn--neutral" onClick={goPrev} disabled={index === 0}>Voltar</button>
        <div className="controls__progress">
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={index + 1}
            aria-label="Progresso do guia"
          >
            <div className="progress__fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
          </div>
          <span className="controls__count">{index + 1} de {total}</span>
        </div>
        <button
          className="icon-btn"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Desligar narração' : 'Ligar narração'}
          title={soundOn ? 'Desligar narração' : 'Ligar narração'}
        >
          {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>
        <button className="btn btn--primary" onClick={goNext} disabled={index === total - 1}>Próximo passo</button>
      </div>
      <p className="controls__hint">Dica: as setas ← → do teclado também avançam e voltam.</p>

      <audio ref={audioRef} preload="auto" />
    </div>
  );
}

/**
 * Palco com "câmera": a screenshot é ampliada e deslocada para enquadrar o passo,
 * com transição suave entre um passo e outro. O destaque e o balão ficam fora da
 * camada ampliada, para o texto manter o tamanho.
 */
function Stage(props: {
  frames: Frame[];
  index: number;
  aspect: number;
  isMobile: boolean;
  onNext: () => void;
  onPrev?: () => void;
  children: React.ReactNode;
}) {
  const { frames, index, aspect, isMobile, onNext, onPrev, children } = props;
  const [ref, box] = useElementSize<HTMLDivElement>();
  const frame = frames[index];
  const step = frame.kind === 'step' ? frame.step : null;
  const media = step && !step.chapter ? step : null;

  // No celular, vídeos de transição enquadram onde estará o próximo hotspot
  const focus = useMemo(() => {
    if (!media) return null;
    if (media.hotspot) return media.hotspot;
    const n = frames[index + 1];
    return n?.kind === 'step' ? n.step.hotspot : null;
  }, [media, frames, index]);

  const view = useMemo(() => {
    if (!box) return null;
    const rect = isMobile && focus ? focusRect(focus, box, aspect) : (media?.zoom ?? FULL);
    return frameView(rect, box, aspect);
  }, [box, isMobile, focus, media, aspect]);

  // Crossfade: mantém a imagem anterior por baixo enquanto a nova aparece
  const currentSrc = media?.image ?? null;
  const [layers, setLayers] = useState<{ prev: string | null; cur: string | null }>({ prev: null, cur: currentSrc });
  if (layers.cur !== currentSrc) setLayers({ prev: layers.cur, cur: currentSrc });

  const hotspot = media?.image ? media.hotspot : null;
  const area = useMemo(() => {
    if (!hotspot || !box || !view) return null;
    const w = hotspot.w ?? 0;
    const h = hotspot.h ?? 0;
    const r = project(view, box, aspect, { x: hotspot.x - w / 2, y: hotspot.y - h / 2, w, h });
    const pad = w ? 6 : 0;
    const min = 26; // área mínima clicável/visível
    const width = Math.max(r.width + pad * 2, min);
    const height = Math.max(r.height + pad * 2, min);
    return {
      left: r.left + r.width / 2 - width / 2,
      top: r.top + r.height / 2 - height / 2,
      width,
      height,
      round: !w,
    };
  }, [hotspot, box, view, aspect]);

  return (
    <div
      ref={ref}
      className={`stage${isMobile ? ' stage--mobile' : ''}`}
      style={{ aspectRatio: isMobile ? '4 / 3' : `${aspect}` }}
    >
      <div
        className="world"
        style={
          box && view
            ? { width: box.w, height: box.w / aspect, transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})` }
            : { width: '100%', aspectRatio: `${aspect}` }
        }
      >
        {layers.prev && <img className="world__media" src={layers.prev} alt="" aria-hidden="true" />}
        {layers.cur && (
          <img key={layers.cur} className="world__media world__media--in" src={layers.cur} alt={media?.narration ?? ''} />
        )}
        {media?.video && (
          <video key={media.id} className="world__media" src={media.video} autoPlay muted playsInline onEnded={onNext} />
        )}
      </div>

      {area && hotspot && (
        <button
          key={`spot-${media!.id}`}
          className={`spot${area.round ? ' spot--dot' : ''}`}
          style={{ left: area.left, top: area.top, width: area.width, height: area.height }}
          onClick={onNext}
          aria-label="Avançar para o próximo passo"
        />
      )}

      {!isMobile && area && hotspot?.text && box && (
        <Tip
          key={`tip-${media!.id}`}
          text={hotspot.text}
          target={area}
          box={box}
          preferred={hotspot.tip}
          position={index + 1}
          total={frames.length}
          onNext={onNext}
          onPrev={onPrev}
        />
      )}

      {children}
    </div>
  );
}

function Tip(props: {
  text: string;
  target: { left: number; top: number; width: number; height: number };
  box: Size;
  preferred: 'left' | 'right' | 'top' | 'bottom' | null;
  position: number;
  total: number;
  onNext: () => void;
  onPrev?: () => void;
}) {
  const { text, target, box, preferred, position, total, onNext, onPrev } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setSize({ w: el.offsetWidth, h: el.offsetHeight });
  }, [text, box.w]);

  const place = size ? placeTip(target, size, box, preferred) : null;

  return (
    <div
      ref={ref}
      className={`tip${place ? ` tip--${place.side}` : ''}`}
      role="status"
      style={place ? { left: place.left, top: place.top } : { left: 0, top: 0, visibility: 'hidden' }}
    >
      <p>{text}</p>
      <div className="tip__footer">
        <span>{position} de {total}</span>
        <div>
          {onPrev && <button className="tip__btn tip__btn--ghost" onClick={onPrev}>Voltar</button>}
          <button className="tip__btn" onClick={onNext}>Próximo</button>
        </div>
      </div>
    </div>
  );
}

function ChapterScreen(props: {
  chapter: Chapter;
  backdrop: string | null;
  resumeAt: number | null;
  total: number;
  onResume: () => void;
  onInternal: (stepId: string | null) => void;
}) {
  const { chapter, backdrop, resumeAt, total, onResume, onInternal } = props;
  return (
    <div className="overlay">
      {backdrop && <img className="overlay__bg" src={backdrop} alt="" />}
      <div className={`overlay__card overlay__card--${chapter.layout}`}>
        <img className="overlay__logo" src="/logo.png" alt="Fidz" />
        {chapter.heading && <h2>{chapter.heading}</h2>}
        {chapter.description && <p>{chapter.description}</p>}
        <div className="overlay__actions">
          {resumeAt && (
            <button className="btn btn--primary" onClick={onResume}>
              Continuar do passo {resumeAt + 1} de {total}
            </button>
          )}
          {chapter.buttons.map((b) =>
            b.href ? (
              <a key={b.label} className="btn btn--primary" href={b.href} target="_blank" rel="noreferrer">
                {b.label}
              </a>
            ) : (
              <button
                key={b.label}
                className={`btn ${resumeAt ? 'btn--ghost' : 'btn--primary'}`}
                onClick={() => onInternal(b.nextStep)}
              >
                {resumeAt ? 'Começar do início' : b.label}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

/** Fim do guia: carimbo, o progresso no assunto e o próximo guia. */
function EndScreen({ demoRef, onReplay }: { demoRef: DemoRef; onReplay: () => void }) {
  const progress = useProgress();
  const { section } = demoRef;
  const next = allDemos.slice(demoRef.index + 1).find((r) => !progress[r.demo.id]?.done)
    ?? allDemos.find((r) => !progress[r.demo.id]?.done);
  const doAssunto = allDemos.filter((r) => r.section.id === section.id);
  const feitos = doAssunto.filter((r) => progress[r.demo.id]?.done).length;
  const left = doAssunto.length - feitos;
  const thumb = next ? thumbOf(next.demo) : null;

  return (
    <div className="fim">
      <div className="fim__top">
        <div className="carimbo" aria-hidden="true">Guia<br />concluído</div>
        <div className="fim__text">
          <h2>{left ? 'Guia concluído' : `Você concluiu ${assuntoNome(section)}`}</h2>
          <p>
            Você terminou {demoRef.demo.title}.{' '}
            {left
              ? `Faltam ${left} ${left === 1 ? 'guia' : 'guias'} em ${assuntoNome(section)}.`
              : `Todos os guias deste assunto estão feitos.`}
          </p>
        </div>
      </div>

      <div className="fim__progress">
        <div className="progress" role="progressbar" aria-valuenow={feitos} aria-valuemin={0} aria-valuemax={doAssunto.length} aria-label={`Guias concluídos em ${assuntoNome(section)}`}>
          <div className="progress__fill" style={{ width: `${(feitos / doAssunto.length) * 100}%` }} />
        </div>
        <span>{feitos} de {doAssunto.length} em {assuntoNome(section)}</span>
      </div>

      {next && (
        <Link to={demoPath(next)} className="fim__next">
          <div className="card__thumb fim__thumb">
            {thumb && <img src={thumb.src} alt="" style={{ transformOrigin: `${thumb.x}% ${thumb.y}%` }} />}
          </div>
          <div>
            <span className="fim__next-label">
              Próximo{next.section.id !== section.id ? `, em ${assuntoNome(next.section)}` : ''} · {demoMinutes(next.demo)} min
            </span>
            <span className="fim__next-title">{next.demo.title}</span>
          </div>
        </Link>
      )}

      <div className="fim__actions">
        {next ? (
          <Link className="btn btn--primary btn--lg" to={demoPath(next)}>Começar o próximo guia</Link>
        ) : (
          <a className="btn btn--primary btn--lg" href="https://fidz.com.br" target="_blank" rel="noreferrer">Conhecer a Fidz</a>
        )}
        <Link className="btn btn--secondary btn--lg" to={`/${section.slug}`}>Voltar para {assuntoNome(section)}</Link>
        <button className="btn btn--link" onClick={onReplay}>Rever este guia</button>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : min;
}

function SoundOnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
    </svg>
  );
}

function SoundOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="m22 9-6 6M16 9l6 6" />
    </svg>
  );
}
