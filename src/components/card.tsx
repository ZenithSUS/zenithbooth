import { useTransition } from "react";
import {
  useCreateVote,
  useDeleteVote,
  useGetAllVotes,
  useUpdateVote,
} from "../hooks/votes";
import { sleep } from "../utils/functions/sleep";
import { useNavigate } from "react-router-dom";
import { ShowPhotos, VoteValues } from "../utils/types";
import { getCurrentImgSticker } from "./ui/img-sticker";
import formatDate from "../utils/functions/format-date";
import userFilter from "../utils/functions/userFilter";
import HeartBtn from "../assets/ui/heart2.png";
import SadBtn from "../assets/ui/sad.png";
import CoolBtn from "../assets/ui/cool.png";
import WowBtn from "../assets/ui/wow.png";

export default function Card({ photo }: { photo: ShowPhotos & VoteValues }) {
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();
  const { mutate: createVote } = useCreateVote();
  const { mutate: deleteVote } = useDeleteVote();
  const { mutate: updateVote } = useUpdateVote();
  const { data: votes } = useGetAllVotes();
  const id = JSON.parse(localStorage.getItem("id") as string);

  const handleView = (id: string) => {
    navigate(`/photo-booth/${id}`);
  };

  const handleVote = (voteType: string, photoId: string) => {
    startTransition(async () => {
      const user = id;

      const existingVote = votes?.find(
        (vote) => vote.photo.$id === photoId && vote.user.$id === user,
      );

      if (existingVote) {
        if (existingVote.voteType === voteType) {
          deleteVote(existingVote.$id);
          await sleep(1000);
        } else {
          updateVote({ documentID: existingVote.$id, voteType });
          await sleep(1000);
        }
      } else {
        createVote({ voteType, photo: photoId, user });
        await sleep(1000);
      }
    });
  };

  return (
    <div
      key={photo.$id}
      className="flex flex-col items-center gap-2.5 rounded border border-gray-200 bg-white p-4 shadow-md"
    >
      <div className="relative w-full p-0.5">
        {getCurrentImgSticker({ sticker: photo.sticker })}
        <img
          src={photo.image1Url as string}
          alt={photo.title}
          className={`h-52 w-full rounded object-cover ${userFilter(
            photo.filters as string[],
          )}`}
        />
      </div>
      <h1 className="text-center font-bold">{photo.title}</h1>
      <button
        className="cursor-pointer bg-transparent"
        onClick={() => navigate(`/account/${photo.userID}`)}
      >
        <h2 className="text-center font-bold hover:underline">
          Author: {photo.author}
        </h2>
      </button>
      <p className="text-sm text-gray-600">
        Shared on: {formatDate(photo.$createdAt)}
      </p>
      <div className="flex items-center">
        <div className="grid grid-cols-4 gap-4">
          <div className="flex cursor-pointer items-center justify-center gap-4">
            <button
              className="disabled:opacity-75"
              disabled={isPending}
              onClick={() => handleVote("Heart", photo.$id)}
            >
              <img
                src={HeartBtn}
                alt="heart"
                className="h-8 w-8 cursor-pointer object-cover transition duration-300 ease-in-out hover:scale-120"
                style={{
                  filter:
                    photo.voteType === "Heart"
                      ? "drop-shadow(0 0 8px rgba(0,0,0,1))"
                      : "none",
                }}
              />
            </button>
            <h2 className="text-md photobooth-text-italic font-bold">
              {photo.heartVoteCount}
            </h2>
          </div>
          <div className="flex cursor-pointer items-center justify-center gap-2">
            <button
              className="disabled:opacity-75"
              disabled={isPending}
              onClick={() => handleVote("Sad", photo.$id)}
            >
              <img
                src={SadBtn}
                alt="sad"
                className="h-10 w-10 cursor-pointer object-cover transition duration-300 ease-in-out hover:scale-120"
                style={{
                  filter:
                    photo.voteType === "Sad"
                      ? "drop-shadow(0 0 8px rgba(0,0,0,1))"
                      : "none",
                }}
              />
            </button>
            <h2 className="text-md photobooth-text-italic font-bold">
              {photo.sadVoteCount}
            </h2>
          </div>

          <div className="flex cursor-pointer items-center justify-center gap-2">
            <button
              className="disabled:opacity-75"
              disabled={isPending}
              onClick={() => handleVote("Cool", photo.$id)}
            >
              <img
                src={CoolBtn}
                alt="cool"
                className="h-10 w-10 cursor-pointer object-cover transition duration-300 ease-in-out hover:scale-120"
                style={{
                  filter:
                    photo.voteType === "Cool"
                      ? "drop-shadow(0 0 8px rgba(0,0,0,1))"
                      : "none",
                }}
              />
            </button>
            <h2 className="text-md photobooth-text-italic font-bold">
              {photo.coolVoteCount}
            </h2>
          </div>

          <div className="flex cursor-pointer items-center justify-center gap-2">
            <button
              className="disabled:opacity-75"
              disabled={isPending}
              onClick={() => handleVote("Wow", photo.$id)}
            >
              <img
                src={WowBtn}
                alt="wow"
                className="h-10 w-10 cursor-pointer object-cover transition duration-300 ease-in-out hover:scale-120"
                style={{
                  filter:
                    photo.voteType === "Wow"
                      ? "drop-shadow(0 0 8px rgba(0,0,0,1))"
                      : "none",
                }}
              />
            </button>
            <h2 className="text-md photobooth-text-italic font-bold">
              {photo.wowVoteCount}
            </h2>
          </div>
        </div>
      </div>
      <button
        onClick={() => handleView(photo.$id)}
        className="bg-button-secondary-bg-dark hover:bg-button-secondary-hover-bg-darker/80 cursor-pointer rounded px-4 py-2 font-bold text-white transition duration-300 ease-in-out hover:scale-105"
      >
        See Full Photo
      </button>
    </div>
  );
}
