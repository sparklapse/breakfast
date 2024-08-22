<script lang="ts" context="module">
  export type ChatMessageData = {
    id: string;
    channel: {
      id: string;
      username: string;
      displayName: string;
    };
    chatter: {
      id: string;
      username: string;
      displayName: string;
    };
    reply: {
      id: string;
      username: string;
      displayName: string;
    } | null;
    text: string;
    color: string;
    fragments: [
      {
        type: string;
        text: string;
      },
    ];
    features: string[];
    platform: string;
  };
</script>

<script lang="ts">
  export let data: ChatMessageData;
</script>
