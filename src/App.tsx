import { useEffect } from 'react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import Central from './Central';
import { findDemo, guide } from './guide';
import Player from './Player';

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <main>
      <Routes>
        <Route path="/" element={<Central />} />
        <Route path="/:section" element={<SectionRoute />} />
        <Route path="/:section/:demo" element={<DemoRoute />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  );
}

function SectionRoute() {
  const params = useParams();
  const section = guide.sections.find((s) => s.slug === params.section);
  if (!section) return <NotFound />;
  return <Central section={section} />;
}

function DemoRoute() {
  const params = useParams();
  const ref = findDemo(params.section, params.demo);
  if (!ref) return <NotFound />;
  // key força remontar o player ao trocar de guia
  return <Player key={ref.demo.id} demoRef={ref} />;
}

function NotFound() {
  return (
    <div className="page not-found">
      <h1>Esse guia não existe</h1>
      <p>O endereço pode ter mudado. Procure o guia na lista.</p>
      <Link to="/" className="btn btn--primary btn--lg">Ver todos os guias</Link>
    </div>
  );
}
