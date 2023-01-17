import { NodeInfo } from "@/types";
import { components } from "../client/apiSchema.generated";

type KeyWithTranslationsModel =
  components["schemas"]["KeyWithTranslationsModel"];

export type KeyChangeValue = {
  key: string;
  oldValue?: string;
  newValue: string;
};

export type KeyChanges = {
  newKeys: KeyChangeValue[];
  changedKeys: KeyChangeValue[];
};

export const getChanges = (
  nodes: NodeInfo[],
  translations: KeyWithTranslationsModel[],
  language: string
): KeyChanges => {
  const newKeys: KeyChangeValue[] = [];
  const changedKeys: KeyChangeValue[] = [];

  nodes.forEach((node) => {
    const translation = translations.find((t) => t.keyName === node.key);
    const change = {
      key: node.key,
      oldValue: translation?.translations[language]?.text,
      newValue: node.characters,
    };

    if (!change.oldValue) {
      newKeys.push(change);
    } else if (change.oldValue !== change.newValue) {
      changedKeys.push(change);
    }
  });

  return { newKeys, changedKeys };
};
