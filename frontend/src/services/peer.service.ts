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
  private negotiating = false;

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
    this.negotiating = false;
    this.init();
  }

  isNegotiating(): boolean {
    return this.negotiating;
  }

  async getOffer(): Promise<RTCSessionDescriptionInit | undefined> {
    if (!this.peer) return;
    if (this.negotiating) return; // ← block if already negotiating
    this.negotiating = true;
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(new RTCSessionDescription(offer));
    return offer;
  }

  async getAnswer(
    offer: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit | undefined> {
    if (!this.peer) return;
    await this.peer.setRemoteDescription(offer);
    const ans = await this.peer.createAnswer();
    await this.peer.setLocalDescription(new RTCSessionDescription(ans));
    return ans;
  }

  async setRemoteDescription(ans: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peer) return;
    if (this.peer.signalingState !== 'have-local-offer') {
      console.warn(
        '[peer] Skipping setRemoteDescription — state:',
        this.peer.signalingState,
      );
      return;
    }
    await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
    this.negotiating = false; // ← unlock after answer applied
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peer) return;
    await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
  }
}

export default new PeerService();
