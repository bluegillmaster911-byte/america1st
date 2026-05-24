import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import QuizTab from './QuizTab';
import ProgressTab from './ProgressTab';
import HomeTab from './HomeTab';
import { loadProgress, getLevelForXp, type UserProgress } from './progression';

// ─── Case History Types & Data ───────────────────────────────────────────────

interface CourtLevel {
  courtName: string;
  courtLevel: string;
  roleInCase: string;
  ruling?: string;
  keyNotes?: string[];
}

interface LandmarkCase {
  id: string;
  caseName: string;
  year: number;
  citation: string;
  areaOfLaw: string;
  proceduralPath: CourtLevel[];
  finalHolding: string;
  significance: string;
  discussionQuestions: string[];
  primarySources?: {
    supremeCourtOpinion?: string;
    lowerCourtOpinion?: string;
    keyFilings?: Array<{ title: string; url: string; description?: string }>;
  };
}

import casesData from './data/cases.json';
import jurisdictionData from './data/jurisdictionMatrix.json';

const landmarkCases = casesData as LandmarkCase[];
const jurisdictionRows = jurisdictionData as JurisdictionRow[];

// ─── Jurisdiction Matrix Types & Data ────────────────────────────────────────

interface JurisdictionRow {
  id: string;
  caseType: string;
  initialForum: string;
  initialForumDetail: string;
  appealPath: string;
  appealDetail: string;
  supremeCourtReview: 'Yes — Discretionary' | 'Yes — As of Right' | 'Limited / Rare';
  overview: string;
  keyNotes: string[];
  relatedCaseIds: string[];
}

// ─── Shared Case Detail View ──────────────────────────────────────────────────

function CaseDetail({ lc }: { lc: LandmarkCase }) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  return (
    <div>
      <div className="mb-8">
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
          {lc.areaOfLaw}
        </span>
        <h2 className="text-3xl font-bold text-slate-900 mb-1">{lc.caseName}</h2>
        <p className="text-slate-500 text-base">
          {lc.citation}&nbsp;·&nbsp;{lc.year}
        </p>
      </div>

      <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-lg mb-8">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-2">
          Final Holding
        </h3>
        <p className="text-base leading-relaxed italic">"{lc.finalHolding}"</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-3">Case Overview</h3>
        <p className="text-slate-700 leading-relaxed">{lc.significance}</p>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Procedural Path</h3>
        <div className="relative">
          <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-slate-200 z-0" />
          <div className="space-y-4 relative z-10">
            {lc.proceduralPath.map((level, index) => {
              const isOpen = selectedLevel === index;
              const isLast = index === lc.proceduralPath.length - 1;
              return (
                <div key={index}>
                  <div
                    onClick={() => setSelectedLevel(isOpen ? null : index)}
                    className={`rounded-2xl border cursor-pointer transition-all duration-200 shadow-sm ${
                      isOpen
                        ? 'border-blue-400 bg-blue-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow'
                    }`}
                  >
                    <div className="flex items-center gap-4 p-5">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          isLast ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900">{level.courtName}</div>
                        <div className="text-sm text-slate-500">{level.courtLevel}</div>
                      </div>
                      <div
                        className={`text-2xl font-light transition-transform duration-200 ${
                          isOpen ? 'rotate-45' : ''
                        } text-slate-400`}
                      >
                        +
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-blue-100">
                        <div className="pt-4 space-y-3">
                          <p className="text-slate-700 leading-relaxed">{level.roleInCase}</p>
                          {level.ruling && (
                            <div className="bg-white border border-blue-200 rounded-xl p-4">
                              <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                Ruling
                              </span>
                              <p className="mt-1 text-slate-800">{level.ruling}</p>
                            </div>
                          )}
                          {level.keyNotes && level.keyNotes.length > 0 && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Key Notes
                              </span>
                              <ul className="mt-2 space-y-2">
                                {level.keyNotes.map((note, i) => (
                                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                                    {note}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {lc.primarySources && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Primary Sources</h3>
          <div className="space-y-3">
            {lc.primarySources.supremeCourtOpinion && (
              <a
                href={lc.primarySources.supremeCourtOpinion}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">⚖</div>
                <div>
                  <div className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors">
                    Full Supreme Court Opinion
                  </div>
                  <div className="text-xs text-slate-500">{lc.citation} · Justia</div>
                </div>
                <div className="ml-auto text-slate-400 group-hover:text-blue-500">→</div>
              </a>
            )}
            {lc.primarySources.lowerCourtOpinion && (
              <a
                href={lc.primarySources.lowerCourtOpinion}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">🏛</div>
                <div>
                  <div className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors">
                    Lower Court Opinion
                  </div>
                  <div className="text-xs text-slate-500">Justia</div>
                </div>
                <div className="ml-auto text-slate-400 group-hover:text-blue-500">→</div>
              </a>
            )}
            {lc.primarySources.keyFilings?.map((filing, i) => (
              <a
                key={i}
                href={filing.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">📄</div>
                <div>
                  <div className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors">
                    {filing.title}
                  </div>
                  {filing.description && (
                    <div className="text-xs text-slate-500">{filing.description}</div>
                  )}
                </div>
                <div className="ml-auto text-slate-400 group-hover:text-blue-500">→</div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Discussion Questions</h3>
        <ol className="space-y-4">
          {lc.discussionQuestions.map((q, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-semibold">
                {i + 1}
              </span>
              <p className="text-slate-700 leading-relaxed pt-0.5">{q}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ─── Fuse instances ──────────────────────────────────────────────────────────

const caseFuse = new Fuse(landmarkCases, {
  keys: ['caseName', 'areaOfLaw', 'significance', 'finalHolding', 'citation'],
  threshold: 0.4,
  includeScore: true,
});

// ─── Jurisdiction Matrix Tab ──────────────────────────────────────────────────

const reviewBadgeColor: Record<JurisdictionRow['supremeCourtReview'], string> = {
  'Yes — Discretionary': 'bg-blue-100 text-blue-800',
  'Yes — As of Right': 'bg-green-100 text-green-800',
  'Limited / Rare': 'bg-slate-100 text-slate-600',
};

interface CellModalData {
  kind: 'type' | 'forum';
  row: JurisdictionRow;
}

function CellModal({ data, onViewCase, onClose }: { data: CellModalData; onViewCase: (id: string) => void; onClose: () => void }) {
  const { kind, row } = data;
  const isType = kind === 'type';
  const title = isType ? row.caseType : row.initialForum;
  const body = isType ? row.overview : row.initialForumDetail;
  const relatedCases = landmarkCases.filter((lc) => row.relatedCaseIds.includes(lc.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-7 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${
              isType ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
            }`}>
              {isType ? 'Type of Case' : 'Initial Forum'}
            </span>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <p className="text-slate-700 leading-relaxed text-sm mb-5">{body}</p>

        {/* Forum — also show the appeal path */}
        {!isType && (
          <div className="bg-slate-50 rounded-xl p-4 mb-5 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Appeal Path</div>
            <div className="font-medium text-slate-800 mb-1">{row.appealPath}</div>
            <p className="text-slate-600 text-xs leading-relaxed">{row.appealDetail}</p>
          </div>
        )}

        {/* Type — show key notes */}
        {isType && row.keyNotes.length > 0 && (
          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Key Points</div>
            <ul className="space-y-2">
              {row.keyNotes.map((note, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Supreme Court review badge */}
        <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 ${reviewBadgeColor[row.supremeCourtReview]}`}>
          <span>Supreme Court review:</span>
          <span>{row.supremeCourtReview}</span>
        </div>

        {/* Related cases */}
        {relatedCases.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Related Landmark Cases</div>
            <div className="space-y-2">
              {relatedCases.map((lc) => (
                <button
                  key={lc.id}
                  onClick={() => { onViewCase(lc.id); onClose(); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {lc.year}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-800 transition-colors text-sm truncate">
                      {lc.caseName}
                    </div>
                    <div className="text-xs text-slate-500">{lc.areaOfLaw}</div>
                  </div>
                  <span className="text-slate-400 group-hover:text-blue-500 font-semibold text-sm flex-shrink-0">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer hint */}
        <p className="text-xs text-slate-400 mt-6">
          Click the row in the matrix for the full {row.caseType} breakdown.
        </p>
      </div>
    </div>
  );
}

const matrixFuse = new Fuse(jurisdictionRows, {
  keys: ['caseType', 'initialForum', 'appealPath', 'overview', 'keyNotes'],
  threshold: 0.4,
  includeScore: true,
});

function JurisdictionMatrixTab({ onViewCase }: { onViewCase: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<JurisdictionRow | null>(null);
  const [cellModal, setCellModal] = useState<CellModalData | null>(null);

  const openCell = (e: React.MouseEvent, kind: 'type' | 'forum', row: JurisdictionRow) => {
    e.stopPropagation();
    setCellModal({ kind, row });
  };

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return jurisdictionRows;
    return matrixFuse.search(searchTerm).map((r) => r.item);
  }, [searchTerm]);

  const relatedCases = useMemo(
    () =>
      selectedRow
        ? landmarkCases.filter((lc) => selectedRow.relatedCaseIds.includes(lc.id))
        : [],
    [selectedRow]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Federal Court Jurisdiction Matrix
        </h1>
        <p className="text-slate-600 max-w-3xl">
          Click any row to explore the forum, appeal path, key notes, and related landmark cases.
          Fuzzy search handles typos — try "tex cort" or "imigration."
        </p>
      </div>

      {/* Fuzzy Search */}
      <div className="mb-6 relative w-full md:w-96">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search, e.g. 'tex cort' or 'bankrupcy'..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-9 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Cell modal */}
      {cellModal && (
        <CellModal
          data={cellModal}
          onViewCase={onViewCase}
          onClose={() => setCellModal(null)}
        />
      )}

      {/* Table */}
      {filteredRows.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left px-5 py-4 font-semibold w-[22%]">
                    <span className="flex items-center gap-1.5">
                      Type of Case
                      <span className="text-slate-400 text-xs font-normal">(click cell)</span>
                    </span>
                  </th>
                  <th className="text-left px-5 py-4 font-semibold w-[22%]">
                    <span className="flex items-center gap-1.5">
                      Initial Forum
                      <span className="text-slate-400 text-xs font-normal">(click cell)</span>
                    </span>
                  </th>
                  <th className="text-left px-5 py-4 font-semibold w-[30%]">Appeal Path</th>
                  <th className="text-left px-5 py-4 font-semibold w-[18%]">Supreme Court</th>
                  <th className="px-5 py-4 w-[8%]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRow(selectedRow?.id === row.id ? null : row)}
                    className={`border-t border-slate-100 cursor-pointer transition-colors ${
                      selectedRow?.id === row.id
                        ? 'bg-blue-50'
                        : i % 2 === 0
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    {/* Type of Case — clickable chip */}
                    <td className="px-5 py-4">
                      <button
                        onClick={(e) => openCell(e, 'type', row)}
                        className="group flex items-center gap-1.5 text-left"
                        title="Click for overview"
                      >
                        <span className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                          {row.caseType}
                        </span>
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center text-xs transition-colors">
                          i
                        </span>
                      </button>
                    </td>
                    {/* Initial Forum — clickable chip */}
                    <td className="px-5 py-4">
                      <button
                        onClick={(e) => openCell(e, 'forum', row)}
                        className="group flex items-center gap-1.5 text-left"
                        title="Click for forum detail"
                      >
                        <span className="text-slate-700 group-hover:text-blue-700 transition-colors leading-snug">
                          {row.initialForum}
                        </span>
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center text-xs transition-colors">
                          i
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{row.appealPath}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                          reviewBadgeColor[row.supremeCourtReview]
                        }`}
                      >
                        {row.supremeCourtReview}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-right">
                      <span
                        className={`inline-block transition-transform duration-200 ${
                          selectedRow?.id === row.id ? 'rotate-90' : ''
                        }`}
                      >
                        ›
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredRows.map((row) => (
              <div
                key={row.id}
                onClick={() => setSelectedRow(selectedRow?.id === row.id ? null : row)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedRow?.id === row.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  {/* Mobile: clickable type + forum chips */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={(e) => openCell(e, 'type', row)}
                      className="flex items-center gap-1 text-left mb-0.5 group"
                    >
                      <span className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                        {row.caseType}
                      </span>
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center text-xs transition-colors flex-shrink-0" style={{ fontSize: '9px' }}>
                        i
                      </span>
                    </button>
                    <button
                      onClick={(e) => openCell(e, 'forum', row)}
                      className="flex items-center gap-1 text-left group"
                    >
                      <span className="text-xs text-slate-500 group-hover:text-blue-600 transition-colors">
                        {row.initialForum}
                      </span>
                      <span className="w-3 h-3 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition-colors flex-shrink-0" style={{ fontSize: '8px' }}>
                        i
                      </span>
                    </button>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                      reviewBadgeColor[row.supremeCourtReview]
                    }`}
                  >
                    {row.supremeCourtReview}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{row.initialForum}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 mb-8">
          <div className="text-4xl mb-3">🔎</div>
          <p className="text-lg font-medium text-slate-700">No results for "{searchTerm}"</p>
          <p className="text-sm mt-1">Try different keywords or check your spelling.</p>
        </div>
      )}

      {/* Detail Panel */}
      {selectedRow && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-md p-8 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{selectedRow.caseType}</h2>
              <p className="text-slate-500 text-sm mt-1">
                {selectedRow.initialForum} → {selectedRow.appealPath.split('→').at(-1)?.trim()}
              </p>
            </div>
            <button
              onClick={() => setSelectedRow(null)}
              className="text-2xl leading-none text-slate-400 hover:text-slate-600 ml-4"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Overview</h3>
              <p className="text-slate-700 leading-relaxed">{selectedRow.overview}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="font-semibold text-slate-900 mb-2">Initial Forum</div>
                <div className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-1">{selectedRow.initialForum}</div>
                <p className="text-slate-700 text-sm">{selectedRow.initialForumDetail}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="font-semibold text-slate-900 mb-2">Appeal Path</div>
                <div className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-1">{selectedRow.appealPath}</div>
                <p className="text-slate-700 text-sm">{selectedRow.appealDetail}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Key Notes</h3>
              <ul className="space-y-2">
                {selectedRow.keyNotes.map((note, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            {/* Supreme Court Review callout */}
            <div className="bg-slate-800 text-white p-4 rounded-xl text-sm">
              <span className="font-semibold">Supreme Court Review: </span>
              <span className="text-slate-300">{selectedRow.supremeCourtReview}. </span>
              {selectedRow.supremeCourtReview === 'Yes — Discretionary' && (
                <span className="text-slate-300">
                  The Court receives roughly 7,000–8,000 petitions per term and grants certiorari in fewer than 100 — about 1–2%.
                </span>
              )}
              {selectedRow.supremeCourtReview === 'Yes — As of Right' && (
                <span className="text-slate-300">
                  The Court is obligated to hear this category of appeal without discretionary review.
                </span>
              )}
              {selectedRow.supremeCourtReview === 'Limited / Rare' && (
                <span className="text-slate-300">
                  Supreme Court involvement in this track is uncommon due to specialized forum structure.
                </span>
              )}
            </div>

            {/* Related Landmark Cases */}
            {relatedCases.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  Related Landmark Cases
                </h3>
                <div className="space-y-2">
                  {relatedCases.map((lc) => (
                    <button
                      key={lc.id}
                      onClick={() => onViewCase(lc.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0 text-xs font-bold">
                        {lc.year}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors text-sm">
                          {lc.caseName}
                        </div>
                        <div className="text-xs text-slate-500">{lc.areaOfLaw}</div>
                      </div>
                      <div className="ml-auto text-slate-400 group-hover:text-blue-500 text-sm">→ View case</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="mt-8 text-xs text-slate-500">
        Educational overview only. Federal jurisdiction involves important nuances and occasional concurrent authority.
      </p>
    </div>
  );
}

// ─── Root App with Tab Navigation ────────────────────────────────────────────

type Tab = 'home' | 'case-history' | 'federal-jurisdiction' | 'quiz' | 'progress';

const NAV_ITEMS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'case-history', label: 'Cases' },
  { id: 'federal-jurisdiction', label: 'Jurisdiction' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'progress', label: 'Progress' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [jumpToCaseId, setJumpToCaseId] = useState<string | null>(null);
  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());

  const currentLevel = getLevelForXp(progress.totalXp);

  const handleViewCase = (caseId: string) => {
    setJumpToCaseId(caseId);
    setCaseSearchTerm('');
    setActiveTab('case-history');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Tab Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-0.5 pt-3 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === item.id
                    ? 'bg-slate-50 border border-b-0 border-slate-200 text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {item.label}
                {item.id === 'progress' && (
                  <span className={`text-xs font-bold ${currentLevel.color} hidden sm:inline`}>
                    Lv.{currentLevel.level}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'home' && (
        <HomeTab
          progress={progress}
          onNavigate={(tab) => setActiveTab(tab as Tab)}
          onViewCase={handleViewCase}
        />
      )}
      {activeTab === 'case-history' && (
        <CaseHistoryTabControlled
          externalSelectedId={jumpToCaseId}
          onExternalHandled={() => setJumpToCaseId(null)}
          externalSearchTerm={caseSearchTerm}
        />
      )}
      {activeTab === 'federal-jurisdiction' && (
        <JurisdictionMatrixTab onViewCase={handleViewCase} />
      )}
      {activeTab === 'quiz' && (
        <QuizTab
          onViewCase={handleViewCase}
          onProgressChange={setProgress}
        />
      )}
      {activeTab === 'progress' && (
        <ProgressTab progress={progress} />
      )}
    </div>
  );
}

// Controlled variant of CaseHistoryTab that accepts external navigation
function CaseHistoryTabControlled({
  externalSelectedId,
  onExternalHandled,
  externalSearchTerm,
}: {
  externalSelectedId: string | null;
  onExternalHandled: () => void;
  externalSearchTerm: string;
}) {
  const [selectedId, setSelectedId] = useState<string>(landmarkCases[0].id);
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm);

  // Apply external navigation (from matrix "View case" links)
  if (externalSelectedId && externalSelectedId !== selectedId) {
    setSelectedId(externalSelectedId);
    setSearchTerm('');
    onExternalHandled();
  }

  const filteredCases = useMemo(() => {
    if (!searchTerm.trim()) return landmarkCases;
    return caseFuse.search(searchTerm).map((r) => r.item);
  }, [searchTerm]);

  const activeCase =
    filteredCases.find((c) => c.id === selectedId) ?? filteredCases[0] ?? null;

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    const results = val.trim()
      ? caseFuse.search(val).map((r) => r.item)
      : landmarkCases;
    if (results.length > 0 && !results.find((c) => c.id === selectedId)) {
      setSelectedId(results[0].id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Landmark SCOTUS Cases</h1>
        <p className="text-slate-500 mb-6">
          Select a case to explore its procedural history, holding, and key analysis.
        </p>

        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search cases, e.g. 'brown board' or 'miranada'..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {filteredCases.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2 mb-10">
            {filteredCases.map((lc) => (
              <button
                key={lc.id}
                onClick={() => setSelectedId(lc.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  activeCase?.id === lc.id
                    ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:text-slate-900'
                }`}
              >
                {lc.caseName}
                <span
                  className={`ml-2 text-xs ${
                    activeCase?.id === lc.id ? 'text-blue-300' : 'text-slate-400'
                  }`}
                >
                  {lc.year}
                </span>
              </button>
            ))}
          </div>
          {activeCase && <CaseDetail key={activeCase.id} lc={activeCase} />}
        </>
      ) : (
        <div className="py-16 text-center text-slate-500">
          <div className="text-4xl mb-3">🔎</div>
          <p className="text-lg font-medium text-slate-700">No cases matched "{searchTerm}"</p>
          <p className="text-sm mt-1">Try different keywords or check your spelling.</p>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-slate-400">
        Educational reference only. Not legal advice.
      </p>
    </div>
  );
}
