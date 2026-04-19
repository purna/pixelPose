import { snapshot } from './state.js';

export function initFrames(state) {
  state.frames = [{ nodes: snapshot(state.nodes), label: 'Frame 1' }];
  state.currentFrame = 0;
}

export function saveFrame(state) {
  if (!state.frames.length) return;
  state.frames[state.currentFrame].nodes = snapshot(state.nodes);
}

export function addFrame(state) {
  saveFrame(state);

  state.frames.push({
    nodes: snapshot(state.nodes),
    label: `Frame ${state.frames.length + 1}`
  });

  state.currentFrame = state.frames.length - 1;
}

export function gotoFrame(state, index) {
  if (!state.frames.length) return;

  state.currentFrame = Math.max(0, Math.min(index, state.frames.length - 1));
  state.nodes = snapshot(state.frames[state.currentFrame].nodes);
}

export function dupFrame(state) {
  if (!state.frames.length) return;
  
  const currentFrameData = state.frames[state.currentFrame];
  state.frames.splice(state.currentFrame + 1, 0, {
    nodes: snapshot(currentFrameData.nodes),
    label: `Frame ${state.currentFrame + 2}`
  });
  state.currentFrame++;
}