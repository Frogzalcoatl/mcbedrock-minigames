/** biome-ignore-all lint/style/useNamingConvention: using enum title casing in an object */

import { type Player, system } from "@minecraft/server";
import { arrRemoveByCallback } from "../shared/arrayHelpers";
i
ort { EventSignal } from "../shared/eventSignal";

ex

 const WaitingRoomState = {
	Clo
d: 0,
	Ful
 2,
	Ope
 1,
};

po
 type WaitingRoomState = (typeof WaitingRoomState)[keyof typeof WaitingRoomState];

ex

 function waitingRoomStateToString(state: WaitingRoomState): string {
	swi
h (state) {
		ca
 WaitingRoomState.Closed:
			r
urn "Closed";
		ca
 WaitingRoomState.Open:
			r
urn "Open";
		ca
 WaitingRoomState.Full:
			r
urn "Full";
		de
ult:
			r
urn "Unknown";
	}



x

 class WaitingRoom {
	pub
c readonly players: Player[];

	/

ount of players required to start the countdown
	pub
c playersToStart: number;

	/

nimum amount of players required to start the game.
	// 
ould be less than or equal to playersToStart
	pub
c minPlayers: number;

	/

ximum amount of players allowed
	pub
c maxPlayers: number;

	/

ngth of countdown
	pub
c startTimeSeconds: number;

	/

conds remaining to start the game
	pub
c secondsRemaining: number;

	/

ent triggers when countdown finishes
	pub
c readonly onCountdownComplete: EventSignal<Player[]>;

	/

second runInterval for countdown
	pri
te _intervalId: number | null;

	/

lf explanatory
	pri
te _state: WaitingRoomState;

	p

c constructor(
		pl
ersToStart: number,
		mi
layers: number,
		ma
layers: number,
		st
tTimeSeconds = 30,
	) {
		th
.players = [];
		th
.playersToStart = playersToStart;
		th
.minPlayers = minPlayers;
		th
.maxPlayers = maxPlayers;
		th
.startTimeSeconds = startTimeSeconds;
		th
.secondsRemaining = startTimeSeconds;
		th
.onCountdownComplete = new EventSignal<Player[]>();
		th
._intervalId = null;
		th
._state = WaitingRoomState.Open;
	}

	p

c get state(): WaitingRoomState {
		re
rn this._state;
	}

	p

te startInterval(): void {
		th
.clearInterval();
		co
t playSoundDuring: number[] = [60, 39, 29, 10, 5, 4, 3, 2, 1];
		if
!playSoundDuring.includes(this.startTimeSeconds)) {
			p
ySoundDuring.push(this.startTimeSeconds);
		}
	th
.secondsRemaining = this.startTimeSeconds;
		co
t intervalId: number = system.runInterval(() => {
			i
(this.players.length < this.minPlayers) {
				
is.secondsRemaining = this.startTimeSeconds;
				
nst playersNeeded: number = this.playersToStart - this.players.length;
				
r (const p of this.players) {
				
.onScreenDisplay.setActionBar(
				
`Waiting for §l${playersNeeded}§r more player${playersNeeded !== 1 ? "s" : ""}...`,
				
;
				

				
turn;
			}
			i
(this.secondsRemaining <= 0) {
				
stem.clearRun(intervalId);
				
is._intervalId = null;
				
is.onCountdownComplete.triggerEvent(this.players);
				
turn;
			}
			f
 (const p of this.players) {
				
onScreenDisplay.setActionBar(
				
Game starting in §l${this.secondsRemaining}§r second${this.secondsRemaining !== 1 ? "s" : ""}`,
				

			}
			i
(playSoundDuring.includes(this.secondsRemaining)) {
				
r (const p of this.players) {
				
.playSound("random.click");
				

			}
			t
s.secondsRemaining--;
		},
0);
		th
._intervalId = intervalId;
	}

	p

te clearInterval(): void {
		if
this._intervalId !== null) {
			s
tem.clearRun(this._intervalId);
		}
}

	p

c addPlayer(player: Player): boolean {
		if
this._state !== WaitingRoomState.Open) {
			l
 message = `§cWaiting room is `;
			m
sage += this._state === WaitingRoomState.Closed ? "closed" : "full";
			p
yer.sendMessage(message);
			r
urn false;
		}
	if
this.players.includes(player)) {
			r
urn false;
		}
	th
.players.push(player);
		if
this._intervalId === null) {
			t
s.startInterval();
		}
	co
t message: string = `§7${player.name}§r§7 joined the game §8[${this.players.length}/${this.maxPlayers}]`;
		fo
(const p of this.players) {
			p
endMessage(message);
		}
	re
rn true;
	}

	p

c removePlayer(playerId: string, playerName: string): void {
		ar
emoveByCallback(this.players, (p) => p.id === playerId);
		if
this.players.length === 0 && this._intervalId !== null) {
			s
tem.clearRun(this._intervalId);
			t
s._intervalId = null;
		} 
se {
			c
st message: string = `§7${playerName}§r§7 left the game`;
			f
 (const p of this.players) {
				
sendMessage(message);
			}
		}
}




