import React, { useState, useMemo } from 'react';
import { Hash, Plus, Edit2, Trash2, Save, X, GripVertical, AlertTriangle, Clock, Tag as TagIcon, ChevronDown, Search, CheckSquare, Square, FolderInput } from 'lucide-react';
import { useLibrary, Tag, TagCategory } from '../context/LibraryContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTagItemProps {
  tag: Tag; usageCount: number; isEditing: boolean; isSelected: boolean;
  onSelect: (id: string) => void; editName: string; editCategory: TagCategory;
  setEditName: (name: string) => void; setEditCategory: (cat: TagCategory) => void;
  saveEdit: () => void; cancelEdit: () => void; startEdit: (id: string, name: string, category: TagCategory) => void; handleDelete: (id: string) => void;
  onViewBooks: (id: string) => void;
}

function SortableTagItem({ tag, usageCount, isEditing, isSelected, onSelect, editName, editCategory, setEditName, setEditCategory, saveEdit, cancelEdit, startEdit, handleDelete, onViewBooks, index = 0 }: SortableTagItemProps & { index?: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1 };
  const categories: TagCategory[] = ['Genre', 'Trope', 'Setting', 'Vibe', 'Other'];

  const cardColorClass = index % 3 === 0 ? 'bg-theme-card-blue' : index % 3 === 1 ? 'bg-theme-card-yellow' : 'bg-theme-card-olive';
  const hoverColorClass = index % 3 === 0 ? 'hover:bg-theme-earth-blue-light' : index % 3 === 1 ? 'hover:bg-theme-earth-yellow-light' : 'hover:bg-theme-earth-olive-green-light';

  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? 'opacity-0' : ''}`}>
      <motion.div layout className={`flex items-center justify-between p-4 rounded-3xl border transition-all shadow-sm ${isSelected ? 'bg-theme-accent1/10 border-theme-accent1/50' : `${cardColorClass} border-theme-border ${hoverColorClass}`}`}>
        <div className="flex items-center gap-3 flex-1">
          {!isEditing && (
            <div className="flex items-center gap-2">
              <button onClick={() => onSelect(tag.id)} className={`p-1 rounded-md transition-colors ${isSelected ? 'text-theme-accent1' : 'text-theme-text-secondary hover:text-theme-text'}`}>
                {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </button>
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-theme-text-secondary hover:text-theme-text">
                <GripVertical className="w-5 h-5" />
              </div>
            </div>
          )}
          
          {isEditing ? (
            <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 mr-4">
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 w-full bg-theme-surface border border-theme-border rounded-xl px-3 py-2 text-theme-text-secondary focus:outline-none focus:border-theme-accent2" autoFocus onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
              <select value={editCategory} onChange={e => setEditCategory(e.target.value as TagCategory)} className="bg-theme-surface border border-theme-border rounded-xl px-3 py-2 text-theme-text-secondary focus:outline-none focus:border-theme-accent2">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <button onClick={saveEdit} className="p-2 text-theme-accent1 hover:bg-theme-accent1/20 rounded-xl transition-colors"><Save className="w-5 h-5" /></button>
                <button onClick={cancelEdit} className="p-2 text-theme-danger hover:bg-theme-danger/20 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
          ) : (
        <div className="flex items-center gap-3 flex-1 cursor-pointer group/tag py-1" onClick={() => onViewBooks(tag.id)}>
              <Hash className="w-5 h-5 text-theme-text-secondary group-hover/tag:text-theme-accent2 transition-colors" />
              <div className="flex flex-col">
                <span className="font-bold text-theme-text group-hover/tag:text-theme-accent2 transition-colors">{tag.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-theme-text-secondary uppercase tracking-wider">{tag.category || 'Other'}</span>
                  {tag.lastUsed && <span className="text-[9px] text-theme-text-secondary flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(tag.lastUsed).toLocaleDateString()}</span>}
                </div>
              </div>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-theme-text-secondary bg-theme-surface px-2 py-0.5 rounded-full border border-theme-border">
                {usageCount} book{usageCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2">
            <button onClick={() => startEdit(tag.id, tag.name, tag.category || 'Other')} className="p-3 text-theme-text-secondary hover:text-theme-accent2 hover:bg-theme-surface rounded-xl transition-colors" title="Rename Tag"><Edit2 className="w-5 h-5" /></button>
            <button onClick={() => handleDelete(tag.id)} className="p-3 text-theme-text-secondary hover:text-theme-danger hover:bg-theme-danger/20 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
export default function Lexicon() {
  const { tags, addTag, renameTag, updateTagCategory, deleteTag, reorderTags, books } = useLibrary();
  const [newTag, setNewTag] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<TagCategory>('Other');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<TagCategory>('Other');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TagCategory | 'All' | 'Recent'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<TagCategory | ''>('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const [selectedTagForBooks, setSelectedTagForBooks] = useState<string | null>(null);

  const categories: TagCategory[] = ['Genre', 'Trope', 'Setting', 'Vibe', 'Other'];
  const tabs = ['All', 'Recent', ...categories];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      addTag(newTag.trim(), newTagCategory);
      setNewTag('');
    }
  };

  const startEdit = (id: string, name: string, category: TagCategory) => {
    setEditingId(id); setEditName(name); setEditCategory(category);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      renameTag(editingId, editName.trim());
      updateTagCategory(editingId, editCategory);
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null); setEditName('');
  };

  const confirmDelete = (id: string) => setDeleteConfirmId(id);

  const executeDelete = () => {
    if (deleteConfirmId) {
      deleteTag(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tags.findIndex((t) => t.id === active.id);
      const newIndex = tags.findIndex((t) => t.id === over.id);
      reorderTags(arrayMove(tags, oldIndex, newIndex));
    }
    setActiveId(null);
  };
  const tagUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tags.forEach(t => counts[t.id] = 0);
    books.forEach(b => {
      b.tags.forEach(tId => {
        if (counts[tId] !== undefined) counts[tId]++;
      });
    });
    return counts;
  }, [books, tags]);

  const filteredTags = useMemo(() => {
    let result = [...tags];
    if (searchQuery.trim()) {
      result = result.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeTab === 'Recent') {
      result = result.sort((a, b) => {
        const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
        const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
        return dateB - dateA;
      });
    } else if (activeTab !== 'All') {
      result = result.filter(t => (t.category || 'Other') === activeTab);
    }
    return result;
  }, [tags, activeTab, searchQuery]);

  const toggleSelectTag = (id: string) => {
    const newSelected = new Set(selectedTagIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedTagIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedTagIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedTagIds.size} tags?`)) {
      selectedTagIds.forEach(id => deleteTag(id));
      setSelectedTagIds(new Set());
    }
  };

  const handleBulkCategorize = (category: TagCategory) => {
    if (selectedTagIds.size === 0) return;
    selectedTagIds.forEach(id => updateTagCategory(id, category));
    setSelectedTagIds(new Set());
    setBulkCategory('');
  };

  const toggleSelectAll = () => {
    if (selectedTagIds.size === filteredTags.length) setSelectedTagIds(new Set());
    else setSelectedTagIds(new Set(filteredTags.map(t => t.id)));
  };
  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-20">
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-surface text-theme-accent2 mb-4 shadow-sm border border-theme-border">
          <Hash className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-theme-text">The Lexicon</h2>
        <p className="text-theme-text-secondary max-w-xl mx-auto">
          Manage your global tagging system. Categorize your books with custom tropes, themes, or reading statuses.
        </p>
      </div>

      <div className="bg-theme-bg border border-theme-border rounded-3xl p-4 shadow-sm relative overflow-hidden">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 relative z-10">
          <div className="flex-1 flex gap-2">
            <input type="text" placeholder="Add a new tag (e.g., 'Enemies to Lovers')" value={newTag} onChange={e => setNewTag(e.target.value)} className="flex-1 bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-theme-text-secondary placeholder:text-theme-text-secondary focus:outline-none focus:border-theme-accent2 shadow-sm" />
            <select value={newTagCategory} onChange={e => setNewTagCategory(e.target.value as TagCategory)} className="bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-theme-text-secondary focus:outline-none focus:border-theme-accent2 shadow-sm w-32">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" disabled={!newTag.trim()} className="bg-theme-accent2 hover:bg-theme-accent2 disabled:opacity-50 text-theme-text dark:text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-md active:scale-95 whitespace-nowrap border border-theme-accent2/20">
            <Plus className="w-5 h-5" /> Add Tag
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-secondary" />
          <input type="text" placeholder="Search tags by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-2xl pl-12 pr-4 py-3 text-theme-text-secondary placeholder:text-theme-text-secondary focus:outline-none focus:border-theme-accent2 shadow-sm transition-all" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={toggleSelectAll} className="text-xs font-bold uppercase tracking-widest text-theme-text-secondary hover:text-theme-accent2 transition-colors flex items-center gap-2">
              {selectedTagIds.size === filteredTags.length && filteredTags.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selectedTagIds.size === filteredTags.length && filteredTags.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
            {selectedTagIds.size > 0 && <span className="text-xs font-bold text-theme-accent1 bg-theme-accent1/20 border border-theme-accent1/50 px-2 py-1 rounded-full">{selectedTagIds.size} Selected</span>}
          </div>

          {selectedTagIds.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 bg-theme-bg border border-theme-border rounded-xl px-3 py-1.5 shadow-sm">
                <FolderInput className="w-4 h-4 text-theme-text-secondary" />
                <select value={bulkCategory} onChange={e => handleBulkCategorize(e.target.value as TagCategory)} className="bg-transparent text-xs font-bold uppercase tracking-wider text-theme-text-secondary focus:outline-none">
                  <option value="">Move to...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleBulkDelete} className="p-2 text-theme-danger hover:bg-theme-danger/20 rounded-xl transition-colors shadow-sm bg-theme-bg border border-theme-border" title="Delete Selected"><Trash2 className="w-5 h-5" /></button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 min-w-max">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all border ${activeTab === tab ? 'bg-theme-accent2 text-theme-text dark:text-white border-theme-accent2 shadow-md' : 'bg-theme-bg text-theme-text-secondary border-theme-border hover:bg-theme-surface'}`}>
              {tab === 'Recent' ? <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Recent</span> : tab}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredTags.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {filteredTags.map((tag, index) => {
                const usageCount = tagUsageCounts[tag.id] || 0;
                const isEditing = editingId === tag.id;
                const isSelected = selectedTagIds.has(tag.id);

                return (
                  <motion.div key={tag.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                    <SortableTagItem index={index} tag={tag} usageCount={usageCount} isEditing={isEditing} isSelected={isSelected} onSelect={toggleSelectTag} editName={editName} editCategory={editCategory} setEditName={setEditName} setEditCategory={setEditCategory} saveEdit={saveEdit} cancelEdit={cancelEdit} startEdit={startEdit} handleDelete={confirmDelete} onViewBooks={setSelectedTagForBooks} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </SortableContext>

          <DragOverlay adjustScale={true}>
            {activeId ? (
              <div className="flex items-center justify-between p-4 rounded-3xl border bg-theme-bg border-theme-accent2 shadow-2xl scale-105 opacity-90">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-1 text-theme-accent2"><GripVertical className="w-5 h-5" /></div>
                  <Hash className="w-5 h-5 text-theme-accent2" />
                  <div className="flex flex-col">
                    <span className="font-bold text-theme-text-secondary">{tags.find(t => t.id === activeId)?.name}</span>
                    <span className="text-[10px] text-theme-text-secondary uppercase tracking-wider">{tags.find(t => t.id === activeId)?.category || 'Other'}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        
        {filteredTags.length === 0 && (
          <div className="text-center py-16 bg-theme-bg rounded-3xl border border-theme-border border-dashed">
            <TagIcon className="w-12 h-12 text-theme-text-secondary mx-auto mb-4" />
            <p className="text-theme-text-secondary text-lg">No tags found.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-theme-bg rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-theme-border">
              <div className="flex items-center gap-3 text-theme-danger mb-4">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Delete Tag?</h3>
              </div>
              <p className="text-theme-text-secondary mb-6">
                This will remove the tag "{tags.find(t => t.id === deleteConfirmId)?.name}" from all books. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl font-bold text-theme-text-secondary hover:bg-theme-surface border border-theme-border transition-colors">
                  Cancel
                </button>
                <button onClick={executeDelete} className="flex-1 py-3 rounded-xl font-bold bg-theme-danger/20 text-theme-danger hover:bg-theme-danger/30 border border-theme-danger/50 transition-colors shadow-sm">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedTagForBooks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-theme-bg rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-theme-border max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-theme-text">Books tagged with "{tags.find(t => t.id === selectedTagForBooks)?.name}"</h3>
              <button onClick={() => setSelectedTagForBooks(null)} className="p-2 text-theme-text-secondary hover:text-theme-text transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="grid gap-4">
              {books.filter(b => b.tags.includes(selectedTagForBooks)).map(book => (
                <div key={book.id} className="flex items-center gap-4 p-4 bg-theme-surface rounded-2xl border border-theme-border">
                  <div className="w-16 h-24 bg-theme-border rounded-lg overflow-hidden shrink-0">
                    {book.coverUrl && <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-theme-text">{book.title}</h4>
                    <p className="text-sm text-theme-text-secondary">{book.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
