import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle, Tag } from 'lucide-react';
import type { Project } from '../data/profileData';
import { GithubIcon } from './SocialIcons';

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-obsidian-950/90 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto glass-panel-glow rounded-2xl border border-gold-glow/30 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-obsidian-900 border border-slate-700 text-slate-400 hover:text-white hover:border-gold-glow/40 transition-all"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Project image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl">
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/20 to-transparent" />

            {/* Category overlay */}
            <div className="absolute bottom-4 left-4">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-obsidian-900/80 border border-gold-glow/30 text-gold-accent font-bold backdrop-blur-sm">
                {project.category}
                {project.period && ` · ${project.period}`}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Title & subtitle */}
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                {project.title}
              </h2>
              <p className="text-sm text-slate-400 font-mono mt-1">
                {project.subtitle}
              </p>
            </div>

            {/* Description — approach & problem */}
            <div>
              <h3 className="text-xs font-mono text-gold-accent tracking-widest uppercase mb-2">
                Overview
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {project.longDescription}
              </p>
            </div>

            {/* Technical Highlights — Architecture */}
            {project.technicalHighlights.length > 0 && (
              <div>
                <h3 className="text-xs font-mono text-gold-accent tracking-widest uppercase mb-3">
                  Technical Highlights
                </h3>
                <div className="space-y-2">
                  {project.technicalHighlights.map((h, i) => (
                    <div key={i} className="text-sm text-slate-300 flex items-start gap-2.5 bg-obsidian-900/40 p-3 rounded-lg border border-slate-800/60">
                      <CheckCircle className="w-4 h-4 text-gold-accent shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Impact metrics */}
            {project.impactMetrics.length > 0 && (
              <div>
                <h3 className="text-xs font-mono text-gold-accent tracking-widest uppercase mb-3">
                  Project Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {project.impactMetrics.map((m) => (
                    <div key={m.label} className="p-3 rounded-lg bg-obsidian-900/40 border border-slate-800/60">
                      <span className="text-[10px] font-mono text-slate-500 block">{m.label}</span>
                      <span className="text-sm font-bold text-white font-mono">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technologies */}
            <div>
              <h3 className="text-xs font-mono text-gold-accent tracking-widest uppercase mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-xs font-mono px-2.5 py-1 rounded-md bg-obsidian-900 text-slate-300 border border-slate-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action links */}
            {(project.demoUrl || project.githubUrl) && (
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800/60">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-lg bg-gold-accent text-obsidian-950 font-bold text-xs flex items-center gap-1.5 hover:bg-gold-glow transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Live Demo
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-obsidian-900 text-slate-300 hover:text-white border border-slate-700 hover:border-gold-glow/30 transition-all"
                    aria-label="GitHub Repository"
                  >
                    <GithubIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
