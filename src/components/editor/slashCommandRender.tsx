import { createRoot, type Root } from 'react-dom/client';
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import SlashCommandMenu, { type SlashCommandItem, type SlashCommandMenuRef } from './SlashCommandMenu';
import { createRef } from 'react';

export function slashCommandRender() {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;
  const menuRef = createRef<SlashCommandMenuRef>();

  return {
    onStart(props: SuggestionProps<string>) {
      container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.zIndex = '50';
      document.body.appendChild(container);

      root = createRoot(container);
      updatePosition(props);
      render(props);
    },

    onUpdate(props: SuggestionProps<string>) {
      updatePosition(props);
      render(props);
    },

    onKeyDown(props: SuggestionKeyDownProps) {
      if (props.event.key === 'Escape') {
        destroy();
        return true;
      }
      return menuRef.current?.onKeyDown(props.event) ?? false;
    },

    onExit() {
      destroy();
    },
  };

  function render(props: SuggestionProps<string>) {
    if (!root) return;
    root.render(
      <SlashCommandMenu
        ref={menuRef}
        query={props.query}
        command={(item: SlashCommandItem) => {
          item.command(props.editor);
          props.editor.chain().focus().deleteRange(props.range).run();
        }}
      />,
    );
  }

  function updatePosition(props: SuggestionProps<string>) {
    if (!container) return;
    const coords = props.editor.view.coordsAtPos(props.range.from);
    container.style.left = `${coords.left}px`;
    container.style.top = `${coords.bottom + 8}px`;
  }

  function destroy() {
    root?.unmount();
    root = null;
    container?.remove();
    container = null;
  }
}
