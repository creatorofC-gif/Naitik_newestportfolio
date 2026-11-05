import React, { useCallback, useState } from 'react';
import { CurtainIntro } from './components/CurtainIntro';
import { HeroVideo } from './components/HeroVideo';
import { ToolboxScroller } from './components/toolbox/ToolboxScroller';
import { ProjectsWhiteboard } from './components/ProjectsWhiteboard';
import { Experience } from './components/Experience';
import { ContactDirect } from './components/ContactDirect';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [introDone, setIntroDone] = useState(false);
  const handleIntroComplete = useCallback(() => setIntroDone(true), []);

  return (
    <div className="relative min-h-screen bg-obsidian-950 text-slate-100 selection:bg-gold-accent selection:text-obsidian-950">
      <CurtainIntro onComplete={handleIntroComplete} />

      <div className={`transition-opacity duration-700 ${introDone ? 'opacity-100' : 'opacity-0'}`}>
        <main>
          <HeroVideo />
          <ToolboxScroller />
          <ProjectsWhiteboard />
          <Experience />
          <ContactDirect />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;
