/**
 * PeerService
 * Singleton wrapper around RTCPeerConnection.
 * Improvements over original:
 *   - Trickle ICE support via onIceCandidate callback
 *   - reset() to cleanly recreate the peer for re-calls
 *   - Proper null guards throughout
 */

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:global.stun.twilio.com:3478',
      ],
    },
  ],
};

class PeerService {
  public peer: RTCPeerConnection | null = null;
  public onIceCandidate: ((candidate: RTCIceCandidate) => void) | null = null;
  private _makingOffer = false;
  private _ignoreOffer = false;

  constructor() {
    this.init();
  }

  private init(): void {
    this.peer = new RTCPeerConnection(ICE_SERVERS);

    this.peer.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };
  }

  reset(): void {
    if (this.peer) {
      this.peer.onicecandidate = null;
      this.peer.close();
      this.peer = null;
    }
    this._makingOffer = false;
    this._ignoreOffer = false;
    this.init();
  }

  get makingOffer() {
    return this._makingOffer;
  }
  get ignoreOffer() {
    return this._ignoreOffer;
  }

  async getOffer(): Promise<RTCSessionDescriptionInit | undefined> {
    if (!this.peer) return;
    try {
      this._makingOffer = true;
      const offer = await this.peer.createOffer();
      if (this.peer.signalingState !== 'stable') return;
      await this.peer.setLocalDescription(offer);
      return this.peer.localDescription ?? undefined;
    } finally {
      this._makingOffer = false;
    }
  }

  async getAnswer(
    offer: RTCSessionDescriptionInit,
    isPolite: boolean,
  ): Promise<RTCSessionDescriptionInit | undefined> {
    if (!this.peer) return;

    const offerCollision =
      this.peer.signalingState !== 'stable' || this._makingOffer;

    this._ignoreOffer = !isPolite && offerCollision;
    if (this._ignoreOffer) {
      console.warn('[peer] Ignoring colliding offer (impolite peer)');
      return;
    }

    await this.peer.setRemoteDescription(offer);
    const ans = await this.peer.createAnswer();
    await this.peer.setLocalDescription(ans);
    return this.peer.localDescription ?? undefined;
  }

  async setRemoteDescription(ans: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peer) return;
    if (this.peer.signalingState !== 'have-local-offer') {
      console.warn('[peer] Skipping answer — state:', this.peer.signalingState);
      return;
    }
    await this.peer.setRemoteDescription(ans);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peer) return;
    try {
      await this.peer.addIceCandidate(candidate);
    } catch (e) {
      if (!this._ignoreOffer) throw e;
    }
  }
}

export default new PeerService();
