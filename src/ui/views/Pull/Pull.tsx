import { Fragment, FunctionalComponent, h } from "preact";
import { useEffect, useState } from "preact/hooks";
import clsx from "clsx";
import {
  Button,
  Container,
  Divider,
  VerticalSpace,
} from "@create-figma-plugin/ui";

import { ActionsBottom } from "@/ui/components/ActionsBottom/ActionsBottom";
import { FullPageLoading } from "@/ui/components/FullPageLoading/FullPageLoading";
import { useGlobalActions } from "@/ui/state/GlobalState";
import { NodeList } from "@/ui/components/NodeList/NodeList";
import { getPullChanges } from "@/tools/getPullChanges";

import { TopBar } from "../../components/TopBar/TopBar";
import { RouteParam } from "../routes";
import styles from "./Pull.css";
import { useConnectedNodes } from "@/ui/hooks/useConnectedNodes";
import { useUpdateNodesMutation } from "@/ui/hooks/useUpdateNodesMutation";
import { useHighlightNodeMutation } from "@/ui/hooks/useHighlightNodeMutation";
import { useSetNodesDataMutation } from "@/ui/hooks/useSetNodesDataMutation";
import { useAllTranslations } from "@/ui/hooks/useAllTranslations";

type Props = RouteParam<"pull">;

export const Pull: FunctionalComponent<Props> = ({ lang }) => {
  const selectedNodes = useConnectedNodes({ ignoreSelection: false });
  const { setRoute, setLanguage } = useGlobalActions();

  const updateNodeLoadable = useUpdateNodesMutation();
  const setNodesDataMutation = useSetNodesDataMutation();
  const allTranslationsLoadable = useAllTranslations();
  const [diffData, setDiffData] = useState<ReturnType<typeof getPullChanges>>();

  async function computeDiff() {
    const translations = await allTranslationsLoadable.getData({
      language: lang ?? "",
    });
    setDiffData(
      getPullChanges(selectedNodes.data?.items || [], lang, translations)
    );
  }

  useEffect(() => {
    computeDiff();
  }, [selectedNodes.data, lang]);

  const handleProcess = async () => {
    if (diffData!.changedNodes.length !== 0) {
      await updateNodeLoadable.mutateAsync({ nodes: diffData!.changedNodes });
    }
    await setNodesDataMutation.mutateAsync({
      nodes:
        selectedNodes.data?.items
          .filter((n) => !n.connected)
          .map((n) => ({
            ...n,
            connected: true,
          })) ?? [],
    });
    setLanguage(lang);
    setRoute("index");
  };

  const handleGoBack = () => {
    setRoute("index");
  };

  const handleRepeat = () => {
    computeDiff();
  };

  const highlightNode = useHighlightNodeMutation();

  const isLoading =
    allTranslationsLoadable.isLoading || selectedNodes.isLoading;

  return (
    <Fragment>
      <TopBar
        onBack={handleGoBack}
        leftPart={<div>Pull translations from Tolgee ({lang})</div>}
      />
      <Divider />
      <VerticalSpace space="large" />
      <Container space="medium">
        {isLoading || !diffData ? (
          <FullPageLoading text="Searching document for translations" />
        ) : allTranslationsLoadable.error ? (
          <Fragment>
            <div>
              {allTranslationsLoadable.error || "Cannot get translation data."}
            </div>
            <ActionsBottom>
              <Button onClick={handleRepeat}>Try again</Button>
            </ActionsBottom>
          </Fragment>
        ) : (
          <Fragment>
            <div>
              {diffData.changedNodes.length === 0
                ? "Everything up to date"
                : `This action will replace translations in ${diffData.changedNodes.length} text(s).`}
            </div>
            {diffData.missingKeys.length > 0 && (
              <Fragment>
                <div className={clsx(styles.sectionTitle)}>Missing keys:</div>
                <div className={clsx(styles.list, styles.missing)}>
                  <NodeList
                    items={diffData.missingKeys}
                    onClick={(item) => highlightNode.mutate({ id: item.id })}
                    compact
                  />
                </div>
              </Fragment>
            )}
            <ActionsBottom>
              {diffData.changedNodes.length === 0 ? (
                <Button data-cy="pull_ok_button" onClick={handleProcess}>
                  OK
                </Button>
              ) : (
                <Fragment>
                  <Button
                    data-cy="pull_cancel_button"
                    onClick={handleGoBack}
                    secondary
                  >
                    Cancel
                  </Button>
                  <Button data-cy="pull_submit_button" onClick={handleProcess}>
                    Replace
                  </Button>
                </Fragment>
              )}
            </ActionsBottom>
          </Fragment>
        )}
      </Container>
    </Fragment>
  );
};
