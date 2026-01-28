import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PromptTemplate, PromptVariable, DEFAULT_CATEGORIES, DEFAULT_TEMPLATES } from '../types/prompt';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: PromptTemplate, filledPrompt: string) => void;
}

export default function PromptLibraryModal({ isOpen, onClose, onSelectTemplate }: PromptLibraryModalProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    prompt: '',
    description: '',
    category: 'general',
    tags: '',
    variables: [] as PromptVariable[],
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const saved = localStorage.getItem('ai-in-one-prompt-templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTemplates(parsed);
      } catch (e) {
        console.error('Failed to parse templates:', e);
        initializeDefaultTemplates();
      }
    } else {
      initializeDefaultTemplates();
    }
  };

  const initializeDefaultTemplates = () => {
    const defaultTemplates: PromptTemplate[] = DEFAULT_TEMPLATES.map((template, index) => ({
      ...template,
      id: `template-${Date.now()}-${index}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
    }));
    setTemplates(defaultTemplates);
    localStorage.setItem('ai-in-one-prompt-templates', JSON.stringify(defaultTemplates));
  };

  const saveTemplates = (newTemplates: PromptTemplate[]) => {
    localStorage.setItem('ai-in-one-prompt-templates', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    // Initialize variable values
    const initialValues: Record<string, string> = {};
    template.variables?.forEach(variable => {
      initialValues[variable.name] = variable.defaultValue || '';
    });
    setVariableValues(initialValues);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    let filledPrompt = selectedTemplate.prompt;
    
    // Replace variables with values
    selectedTemplate.variables?.forEach(variable => {
      const value = variableValues[variable.name] || variable.defaultValue || '';
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      filledPrompt = filledPrompt.replace(regex, value);
    });

    // Update usage count
    const updatedTemplates = templates.map(t => 
      t.id === selectedTemplate.id 
        ? { ...t, usageCount: t.usageCount + 1, updatedAt: new Date() }
        : t
    );
    saveTemplates(updatedTemplates);

    onSelectTemplate(selectedTemplate, filledPrompt);
    setSelectedTemplate(null);
    onClose();
  };

  const toggleFavorite = (templateId: string) => {
    const updatedTemplates = templates.map(t =>
      t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
    );
    saveTemplates(updatedTemplates);
  };

  const deleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      saveTemplates(updatedTemplates);
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
      }
    }
  };

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.prompt) {
      alert('Name and prompt are required!');
      return;
    }

    // Auto-detect variables from prompt ({{variable}})
    const variableMatches = newTemplate.prompt.match(/{{(\w+)}}/g);
    const detectedVariables: PromptVariable[] = [];
    if (variableMatches) {
      const uniqueVars = [...new Set(variableMatches.map(v => v.replace(/[{}]/g, '')))];
      uniqueVars.forEach(varName => {
        detectedVariables.push({
          name: varName,
          placeholder: `Enter ${varName}`,
          required: true,
        });
      });
    }

    const template: PromptTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplate.name,
      prompt: newTemplate.prompt,
      description: newTemplate.description,
      category: newTemplate.category,
      tags: newTemplate.tags.split(',').map(t => t.trim()).filter(t => t),
      variables: detectedVariables,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      isFavorite: false,
    };

    saveTemplates([...templates, template]);
    setShowAddForm(false);
    setNewTemplate({
      name: '',
      prompt: '',
      description: '',
      category: 'general',
      tags: '',
      variables: [],
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl mx-4"
        style={{
          background: '#000000',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div className="px-7 py-5 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white" style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.03em' }}>
                Prompt Library
              </h2>
              <p className="text-white/40 mt-1" style={{ fontSize: '14px' }}>
                {templates.length} templates • Use Ctrl+P for quick access
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-white transition-all hover:bg-white/10"
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {showAddForm ? 'Cancel' : 'New Template'}
              </button>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white transition-all"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-white transition-all focus:bg-white/8"
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              outline: 'none',
            }}
          />

          {/* Categories */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className="transition-all whitespace-nowrap"
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '500',
                background: selectedCategory === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedCategory === 'all' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                border: '1px solid ' + (selectedCategory === 'all' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'),
              }}
            >
              All
            </button>
            {DEFAULT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="transition-all whitespace-nowrap"
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '500',
                  background: selectedCategory === cat.id ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedCategory === cat.id ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid ' + (selectedCategory === cat.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'),
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex" style={{ height: 'calc(90vh - 200px)' }}>
          {/* Add Form OR Template List */}
          {showAddForm ? (
            <div className="w-1/3 border-r overflow-y-auto p-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <h3 className="text-white text-lg font-semibold mb-4">Create New Template</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Name*</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., API Documentation Generator"
                    className="w-full text-white transition-all focus:bg-white/8"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Category</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full text-white transition-all"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      outline: 'none',
                    }}
                  >
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id} style={{ background: '#000' }}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Description</label>
                  <input
                    type="text"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Brief description"
                    className="w-full text-white transition-all focus:bg-white/8"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newTemplate.tags}
                    onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                    placeholder="e.g., api, documentation, backend"
                    className="w-full text-white transition-all focus:bg-white/8"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">
                    Prompt* (Use {`{{variableName}}`} for variables)
                  </label>
                  <textarea
                    value={newTemplate.prompt}
                    onChange={(e) => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
                    placeholder={`Write your prompt here...\n\nExample:\nGenerate {{type}} documentation for:\n{{code}}`}
                    rows={12}
                    className="w-full text-white transition-all focus:bg-white/8 font-mono"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                  <p className="text-white/40 text-xs mt-1">
                    💡 Variables detected: {newTemplate.prompt.match(/{{(\w+)}}/g)?.join(', ') || 'None'}
                  </p>
                </div>

                <button
                  onClick={handleAddTemplate}
                  className="w-full transition-all hover:bg-white/95"
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: '#ffffff',
                    color: '#000000',
                    border: 'none',
                  }}
                >
                  Create Template
                </button>
              </div>
            </div>
          ) : (
            <div className="w-1/3 border-r overflow-y-auto p-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id ? 'bg-white/12' : 'bg-white/4'
                  }`}
                  style={{
                    border: `1px solid ${selectedTemplate?.id === template.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '18px' }}>
                        {DEFAULT_CATEGORIES.find(c => c.id === template.category)?.icon}
                      </span>
                      <h3 className="text-white font-medium" style={{ fontSize: '14px' }}>
                        {template.name}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(template.id);
                      }}
                      style={{ fontSize: '16px' }}
                    >
                      {template.isFavorite ? '⭐' : '☆'}
                    </button>
                  </div>
                  {template.description && (
                    <p className="text-white/50 text-xs mb-2 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'rgba(255, 255, 255, 0.6)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>Used {template.usageCount} times</span>
                    {template.variables && template.variables.length > 0 && (
                      <span>{template.variables.length} variables</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          )}

          {/* Template Preview/Edit */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedTemplate ? (
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-white text-xl font-semibold mb-2">
                      {selectedTemplate.name}
                    </h3>
                    {selectedTemplate.description && (
                      <p className="text-white/60 text-sm">
                        {selectedTemplate.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTemplate(selectedTemplate.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>

                {/* Variables Form */}
                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-white text-sm font-medium mb-3">Fill Variables:</h4>
                    <div className="space-y-3">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable.name}>
                          <label className="text-white/60 text-xs mb-1 block">
                            {variable.name}
                            {variable.required && <span className="text-red-400">*</span>}
                          </label>
                          <input
                            type="text"
                            placeholder={variable.placeholder}
                            value={variableValues[variable.name] || ''}
                            onChange={(e) =>
                              setVariableValues({
                                ...variableValues,
                                [variable.name]: e.target.value,
                              })
                            }
                            className="w-full text-white transition-all focus:bg-white/8"
                            style={{
                              padding: '10px 14px',
                              borderRadius: '10px',
                              fontSize: '14px',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              outline: 'none',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompt Preview */}
                <div className="mb-6">
                  <h4 className="text-white text-sm font-medium mb-3">Prompt Preview:</h4>
                  <div
                    className="p-4 rounded-xl text-white/80 text-sm whitespace-pre-wrap font-mono"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      maxHeight: '300px',
                      overflowY: 'auto',
                    }}
                  >
                    {selectedTemplate.prompt.replace(/{{(\w+)}}/g, (match, varName) => {
                      const value = variableValues[varName];
                      return value ? `[${value}]` : match;
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleUseTemplate}
                    className="flex-1 transition-all hover:bg-white/95"
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      background: '#ffffff',
                      color: '#000000',
                      border: 'none',
                    }}
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="px-6 transition-all hover:bg-white/10"
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">
                <div className="text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-lg">Select a template to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
