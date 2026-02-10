import { Extension } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import { slashCommandRender } from './slashCommandRender';

const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: true,
        items: ({ query }) => {
          // Return a non-empty array so the menu renders; filtering happens in the component
          return query !== undefined ? [query] : [''];
        },
        command: () => {
          // Command execution is handled in slashCommandRender
        },
        render: slashCommandRender,
      }),
    ];
  },
});

export default SlashCommand;
