import { Fragment, h } from "preact";
import {
  Button,
  Container,
  Divider,
  Muted,
  Text,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { useGlobalState } from "@/ui/state/GlobalState";
import { FullPageLoading } from "@/ui/components/FullPageLoading/FullPageLoading";

import { NodeList } from "../../components/NodeList/NodeList";
import { TopBar } from "../../components/TopBar/TopBar";
import { useSelectedNodes } from "@/ui/hooks/useSelectedNodes";
import { useConnectedMutation } from "@/ui/hooks/useConnectedMutation";
import { useUpdateNodesMutation } from "@/ui/hooks/useUpdateNodesMutation";
import { LocateNodeButton } from "@/ui/components/LocateNodeButton/LocateNodeButton";
import { getPullChanges } from "@/tools/getPullChanges";
import { useAllTranslations } from "@/ui/hooks/useAllTranslations";

export const CopyView = () => {
  const selectionLoadable = useSelectedNodes();
  const language = useGlobalState((c) => c.config?.language);
  const connectedNodesLoadable = useConnectedMutation({
    ignoreSelection: false,
  });

  const selection = selectionLoadable.data?.items ?? [];

  const nothingSelected = !selectionLoadable.data?.somethingSelected;

  const updateNodesLoadalbe = useUpdateNodesMutation();
  const allTranslationsLoadable = useAllTranslations();

  const handlePull = async () => {
    const translations = await allTranslationsLoadable.getData({
      language: language ?? "",
    });

    const connectedNodes = await connectedNodesLoadable.mutateAsync(undefined);

    const { changedNodes } = getPullChanges(
      connectedNodes.items,
      language!,
      translations
    );

    await updateNodesLoadalbe.mutateAsync({ nodes: changedNodes });
  };

  if (
    allTranslationsLoadable.isLoading ||
    connectedNodesLoadable.isLoading ||
    updateNodesLoadalbe.isLoading
  ) {
    return <FullPageLoading text="Updating translations" />;
  }

  return (
    <Fragment>
      <Container
        space="medium"
        style={{ paddingBlock: "var(--space-extra-small)" }}
      >
        <TopBar
          leftPart={
            <Fragment>
              <Text>Page copy - {language ? language : "keys"}</Text>
              {language && (
                <Button data-cy="copy_view_pull_button" onClick={handlePull}>
                  {nothingSelected ? "Pull all" : "Pull"}
                </Button>
              )}
            </Fragment>
          }
        />
      </Container>
      <Divider />
      <VerticalSpace space="large" />

      {nothingSelected ? (
        <Container space="medium">
          <Text>No texts selected</Text>
        </Container>
      ) : (
        <NodeList
          items={selection}
          keyComponent={(node) => {
            if (!node.connected) {
              return <Muted>Not connected</Muted>;
            }
            return node.key || "";
          }}
          actionCallback={(item) => <LocateNodeButton nodeId={item.id} />}
        />
      )}
    </Fragment>
  );
};
