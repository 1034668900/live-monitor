<template>
  <div class="no-stream-placeholder">
    <div class="icon">📺</div>
    <div class="message">No Stream Available</div>
    <div class="room-info">LiveId: {{ roomId }}</div>
    <div class="status">Waiting for host to start streaming</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  roomId: string;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.no-stream-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: 2;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);

  .icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.8;
    animation: pulse 2s infinite;
  }

  .message {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 8px;
    text-align: center;
  }

  .room-info {
    font-size: 14px;
    opacity: 0.7;
    text-align: center;
    margin-bottom: 8px;
  }

  .status {
    font-size: 12px;
    opacity: 0.6;
    text-align: center;
    animation: blink 1.5s infinite;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 0.6;
  }
  100% {
    opacity: 0.3;
  }
}

/* Dark theme variant */
.no-stream-placeholder.dark {
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
}

/* Loading variant */
.no-stream-placeholder.loading {
  background: linear-gradient(135deg, #4299e1 0%, #667eea 100%);
}

.no-stream-placeholder.loading .status::after {
  content: '...';
  animation: dots 1.5s infinite;
}

@keyframes dots {
  0%, 20% {
    color: transparent;
    text-shadow: .25em 0 0 transparent, .5em 0 0 transparent;
  }
  40% {
    color: white;
    text-shadow: .25em 0 0 transparent, .5em 0 0 transparent;
  }
  60% {
    text-shadow: .25em 0 0 white, .5em 0 0 transparent;
  }
  80%, 100% {
    text-shadow: .25em 0 0 white, .5em 0 0 white;
  }
}
</style> 