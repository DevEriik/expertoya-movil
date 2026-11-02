import { Redirect, useLocalSearchParams } from "expo-router";

export default function ChatDeepLinkScreen() {
  const params = useLocalSearchParams<{ solicitudId?: string | string[] }>();
  const solicitudId = Array.isArray(params.solicitudId)
    ? params.solicitudId[0]
    : params.solicitudId;

  if (!solicitudId) {
    return <Redirect href="/(tabs)/chat" />;
  }

  return (
    <Redirect
      href={{ pathname: "/(tabs)/chat", params: { chatId: solicitudId } }}
    />
  );
}
