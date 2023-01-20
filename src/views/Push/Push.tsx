import { Fragment, FunctionalComponent, h } from "preact";
import { useMemo, useState } from "preact/hooks";
import {
  Button,
  Container,
  Divider,
  VerticalSpace,
} from "@create-figma-plugin/ui";

import { useApiMutation, useApiQuery } from "@/client/useQueryApi";
import { ActionsBottom } from "@/components/ActionsBottom/ActionsBottom";
import { FullPageLoading } from "@/components/FullPageLoading/FullPageLoading";
import { useGlobalActions, useGlobalState } from "@/state/GlobalState";
import { getChanges } from "@/tools/getChanges";
import { TopBar } from "../../components/TopBar/TopBar";
import { RouteParam } from "../routes";
import { Changes } from "./Changes";

type Props = RouteParam<"push">;

export const Push: FunctionalComponent<Props> = ({ nodes }) => {
  const language = useGlobalState((c) => c.config!.lang!);
  const { setRoute } = useGlobalActions();
  const keys = useMemo(() => [...new Set(nodes.map((n) => n.key))], [nodes]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const translationsLoadable = useApiQuery({
    url: "/v2/projects/translations",
    method: "get",
    query: {
      languages: [language],
      size: 10000,
      filterKeyName: keys,
    },
    options: {
      cacheTime: 0,
      staleTime: 0,
    },
  });

  const updateTranslations = useApiMutation({
    url: "/v2/projects/translations",
    method: "post",
  });

  const handleGoBack = () => {
    setRoute("index");
  };

  const changes = useMemo(() => {
    return getChanges(
      nodes,
      translationsLoadable.data?._embedded?.keys || [],
      language
    );
  }, [translationsLoadable.data, nodes]);

  const handleSubmit = async () => {
    const promises = [...changes.changedKeys, ...changes.newKeys].map((key) =>
      updateTranslations.mutateAsync({
        content: {
          "application/json": {
            key: key.key,
            namespace: key.ns,
            translations: { [language]: key.newValue },
          },
        },
      })
    );
    try {
      await Promise.all(promises);
      setSuccess(true);
    } catch (e) {
      setError(true);
    }
  };

  const handleRepeat = () => {
    setError(false);
    setSuccess(false);
    translationsLoadable.refetch();
  };

  const isLoading =
    translationsLoadable.isFetching || updateTranslations.isLoading;

  const changesSize = changes.changedKeys.length + changes.newKeys.length;

  return (
    <Fragment>
      <TopBar
        onBack={handleGoBack}
        leftPart={<div>Push translations to Tolgee platform</div>}
      />
      <Divider />
      <VerticalSpace space="large" />
      <Container space="medium">
        {isLoading ? (
          <FullPageLoading />
        ) : error ? (
          <Fragment>
            <div>
              {updateTranslations.error || "An error has occured during push."}
            </div>
            <ActionsBottom>
              <Button onClick={handleRepeat}>Try again</Button>
            </ActionsBottom>
          </Fragment>
        ) : success ? (
          <Fragment>
            <div>{changesSize} key(s) updated!</div>
            <ActionsBottom>
              <Button onClick={handleGoBack}>Ok</Button>
            </ActionsBottom>
          </Fragment>
        ) : changesSize === 0 ? (
          <Fragment>
            <div>Everything up to date</div>
            <ActionsBottom>
              <Button onClick={handleGoBack}>Ok</Button>
            </ActionsBottom>
          </Fragment>
        ) : (
          <Fragment>
            <Changes changes={changes} />
            <ActionsBottom>
              <Button onClick={handleGoBack} secondary>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Push to Tolgee</Button>
            </ActionsBottom>
          </Fragment>
        )}
      </Container>
    </Fragment>
  );
};
