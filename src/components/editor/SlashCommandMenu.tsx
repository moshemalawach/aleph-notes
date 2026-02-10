import { forwardRef, useEffect, useImperativeHandle, useState, useCallback } from 'react';
import type { Editor } from '@tiptap/core';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
}


function getCommands(): SlashCommandItem[] {
  return [
    {
      title: 'Heading 1',
      description: 'Large heading',
      icon: <span className="font-bold text-sm">H1</span>,
      command: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: 'Heading 2',
      description: 'Medium heading',
      icon: <span className="font-bold text-sm">H2</span>,
      command: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: 'Heading 3',
      description: 'Small heading',
      icon: <span className="font-bold text-sm">H3</span>,
      command: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: 'Bullet List',
      description: 'Unordered list',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
        </svg>
      ),
      command: (e) => e.chain().focus().toggleBulletList().run(),
    },
    {
      title: 'Ordered List',
      description: 'Numbered list',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
          <text x="2" y="8" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">1</text>
          <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">2</text>
          <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">3</text>
        </svg>
      ),
      command: (e) => e.chain().focus().toggleOrderedList().run(),
    },
    {
      title: 'Task List',
      description: 'Checklist with toggles',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="5" width="6" height="6" rx="1" /><path d="M5 8l1.5 1.5L9 6.5" />
          <line x1="13" y1="8" x2="21" y2="8" /><rect x="3" y="13" width="6" height="6" rx="1" /><line x1="13" y1="16" x2="21" y2="16" />
        </svg>
      ),
      command: (e) => e.chain().focus().toggleTaskList().run(),
    },
    {
      title: 'Code Block',
      description: 'Syntax-highlighted code',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
      ),
      command: (e) => e.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: 'Blockquote',
      description: 'Quoted text block',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 8V6a4 4 0 00-4-4H4v2h2a2 2 0 012 2v2H4v6h6V8zm12 0V6a4 4 0 00-4-4h-2v2h2a2 2 0 012 2v2h-4v6h6V8z" />
        </svg>
      ),
      command: (e) => e.chain().focus().toggleBlockquote().run(),
    },
    {
      title: 'Horizontal Rule',
      description: 'Visual divider',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      ),
      command: (e) => e.chain().focus().setHorizontalRule().run(),
    },
    {
      title: 'Table',
      description: '3x3 table',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      ),
      command: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      title: 'Image',
      description: 'Insert from URL',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
        </svg>
      ),
      command: (e) => {
        const url = window.prompt('Image URL:');
        if (url) e.chain().focus().setImage({ src: url }).run();
      },
    },
  ];
}

export interface SlashCommandMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface Props {
  query: string;
  command: (item: SlashCommandItem) => void;
}

const SlashCommandMenu = forwardRef<SlashCommandMenuRef, Props>(
  ({ query, command }, ref) => {
    const allItems = getCommands();
    const items = query
      ? allItems.filter((item) =>
          item.title.toLowerCase().includes(query.toLowerCase()),
        )
      : allItems;

    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [query]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) command(item);
      },
      [items, command],
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        if (event.key === 'Escape') {
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="bg-elevated border border-edge rounded-lg shadow-lg p-3 text-sm text-ink-muted">
          No results
        </div>
      );
    }

    return (
      <div className="bg-elevated border border-edge rounded-lg shadow-lg py-1 w-64 max-h-80 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.title}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors ${
              index === selectedIndex ? 'bg-hover' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-md border border-edge bg-surface flex items-center justify-center text-ink-muted shrink-0">
              {item.icon}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink">{item.title}</div>
              <div className="text-xs text-ink-muted">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    );
  },
);

SlashCommandMenu.displayName = 'SlashCommandMenu';
export default SlashCommandMenu;
