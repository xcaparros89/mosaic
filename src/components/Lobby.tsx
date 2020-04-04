import { SocketIO } from "boardgame.io/multiplayer";
import { Client } from "boardgame.io/react";
import React, { useEffect } from "react";
import { Redirect, useParams } from "react-router-dom";
import { SERVER_URL } from "../config/client";
import { useStoreActions, useStoreState } from "../store";
import { MosaicBoard } from "./MosaicBoard";
import { MosaicGame } from "./MosaicGame";

export const CreateGame: React.FC = () => {
  const createGameRoom = useStoreActions(s => s.createGameRoom);
  const roomID = useStoreState(s => s.roomID);

  if (roomID) return <Redirect to={`/rooms/${roomID}`} />;

  return (
    <div>
      <button onClick={() => createGameRoom(2)}>Create 2 player room</button>
      <button onClick={() => createGameRoom(3)}>Create 3 player room</button>
      <button onClick={() => createGameRoom(4)}>Create 4 player room</button>
    </div>
  );
};

const GameClient = Client({
  game: MosaicGame,
  board: MosaicBoard,
  multiplayer: SocketIO({ server: SERVER_URL })
});

export const GameLobby = () => {
  const { id } = useParams();
  const nickname = useStoreState(s => s.nickname);
  const roomMetadata = useStoreState(s => s.roomMetadata);
  const loadRoomMetadata = useStoreActions(s => s.loadRoomMetadata);
  const joinRoom = useStoreActions(s => s.joinRoom);
  const activeRoomPlayer = useStoreState(s => s.activeRoomPlayer);

  const gameRoomFull = roomMetadata?.players.filter(p => !p.name).length === 0;

  useEffect(() => {
    const intervalID = setInterval(() => {
      if (id) loadRoomMetadata(id);
    }, 500);

    return () => clearInterval(intervalID);
  }, [loadRoomMetadata, id]);

  useEffect(() => {
    // find first empty seat ID
    const emptySeatID = roomMetadata?.players.find(p => !p.name)?.id;
    const alreadyJoined = roomMetadata?.players.find(p => {
      return p.id === activeRoomPlayer?.playerID && p.name === nickname;
    });

    if (!alreadyJoined && emptySeatID !== undefined && nickname && id) {
      joinRoom({ playerID: emptySeatID, playerName: nickname, roomID: id });
    }
  }, [roomMetadata]);

  if (gameRoomFull) {
    return <GameClient playerID={String(activeRoomPlayer?.playerID)} />;
  }

  return (
    <div>
      {roomMetadata && (
        <div>
          {roomMetadata.players?.map(player => {
            return player.name ? (
              <div key={player.id}>Player: {player.name}</div>
            ) : (
              <div key={player.id}>Empty seat </div>
            );
          })}
        </div>
      )}
      <span>Game will start when all players join!</span>
    </div>
  );
};