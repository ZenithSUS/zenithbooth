import { useRef, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useDeletePhoto, useGetPhoto } from "../../hooks/photos";
import { useCreateSavedPhoto } from "../../hooks/saved";
import { useCreateDownloaded } from "../../hooks/downloaded";
import {
  useCreateVote,
  useDeleteVote,
  useUpdateVote,
  useGetAllVotes,
} from "../../hooks/votes";
import { sleep } from "../../utils/functions/sleep";
import deletePhotos from "../../utils/functions/delete-photo";
import downloadAllImages from "../../utils/functions/download";
import formatDate from "../../utils/functions/format-date";
import userFilter from "../../utils/functions/userFilter";
import userBackground from "../../utils/functions/userBackground";
import Loading from "../../components/ui/loading";
import BackIcon from "../../assets/ui/back.svg";
import SaveIcon from "../../assets/ui/save.png";
import DeleteIcon from "../../assets/ui/bin.png";
import DownloadIcon from "../../assets/ui/downloading.png";
import HeartBtn from "../../assets/ui/heart2.png";
import SadBtn from "../../assets/ui/sad.png";
import CoolBtn from "../../assets/ui/cool.png";
import WowBtn from "../../assets/ui/wow.png";
import getCurrentSticker from "../../components/ui/cam-sticker";
import Modal from "react-modal";

Modal.setAppElement("#root");

export default function PhotoUser() {
  const { id } = useParams();
  const userId = JSON.parse(localStorage.getItem("id") as string);
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userID = JSON.parse(localStorage.getItem("id") as string);
  const { mutate: createSaved } = useCreateSavedPhoto();
  const { mutate: createDownload } = useCreateDownloaded();
  const { mutate: createVote } = useCreateVote();
  const { mutate: deleteVote } = useDeleteVote();
  const { mutate: updateVote } = useUpdateVote();
  const { mutate: deletePhoto } = useDeletePhoto(id as string);
  const { data: votes, isLoading: votesLoading } = useGetAllVotes();
  const { data: photo, isLoading: photoLoading } = useGetPhoto(id as string);
  const photoBoothRef = useRef<HTMLDivElement>(null);

  let userFilters = "";
  let userBg = "";

  const handleBack = () => {
    navigate("/social");
  };

  if (photoLoading || votesLoading) return <Loading />;

  if (!photo || !votes) {
    window.location.href = "/social";
    return null;
  }
  const photoVotes =
    votes?.filter((vote) => vote.photo && vote.photo.$id === photo.$id) || [];

  const heartVoteCount = photoVotes.filter(
    (vote) => vote.voteType === "Heart",
  ).length;
  const sadVoteCount = photoVotes.filter(
    (vote) => vote.voteType === "Sad",
  ).length;
  const coolVoteCount = photoVotes.filter(
    (vote) => vote.voteType === "Cool",
  ).length;
  const wowVoteCount = photoVotes.filter(
    (vote) => vote.voteType === "Wow",
  ).length;

  const voteType = photoVotes.find(
    (vote) => vote.user.$id === userID,
  )?.voteType;

  if (photo.filters && photo.border && photo.background) {
    userFilters = userFilter(photo.filters as string[]);
    userBg = userBackground(Number(photo.background), Number(photo.border));
  }

  const images = [photo.image1Url, photo.image2Url, photo.image3Url];

  const handleDownload = async (photoID: string, userID: string) => {
    try {
      await downloadAllImages({
        photoBoothRef: photoBoothRef as React.RefObject<HTMLDivElement>,
      });
      createDownload({
        photoID: photoID,
        userID: userID,
      });
    } catch (error) {
      toast.error("There is something wrong when downloading an image");
    }
  };

  const handleSave = (photoID: string, userID: string) => {
    startTransition(async () => {
      createSaved(
        {
          photoID: photoID,
          userID: userID,
        },
        {
          onSuccess: () => {
            toast.success("Saved Successfully");
          },
          onError: (error) => {
            if (error instanceof Error) {
              toast.error(error.message);
              console.error("Error adding user", error);
            }
          },
        },
      );
      await sleep(1200);
    });
  };

  const handleVote = (voteType: string, photoId: string) => {
    startTransition(async () => {
      const user = userID;

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

  const handleDelete = () => {
    setIsModalOpen(true);
  };

  const executeDelete = (photoID: string) => {
    startTransition(async () => {
      if (!photoID || !photo.imagesId) return;
      const imagesId = [
        photo.imagesId[0],
        photo.imagesId[1],
        photo.imagesId[2],
      ];
      deletePhotos(imagesId);
      deletePhoto(photoID, {
        onSuccess: () => {
          navigate("/social");
          toast.success("Deleted Successfully");
        },
        onError: (error) => {
          if (error instanceof Error) {
            toast.error(error.message);
            console.error("Error deleting photo", error);
          }
        },
      });

      await sleep(2000);
    });
  };

  return (
    <div className="mx-auto flex min-h-screen flex-col items-center justify-center gap-2 p-4">
      <Modal
        isOpen={isModalOpen}
        parentSelector={() => document.querySelector("#root") as HTMLElement}
        className={
          "bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
        }
        overlayClassName={
          "fixed inset-0 z-40 bg-black/50 bg-opacity-50 backdrop-blur-sm"
        }
      >
        <div className="flex min-w-screen flex-col md:min-w-[400px]">
          <form className="bg-primary grid grid-cols-1 place-items-center gap-3 rounded-2xl p-4">
            <h2 className="text-center text-2xl font-bold">Delete Photo?</h2>
            <div className="flex gap-2">
              <button
                type="button"
                name="cancel"
                disabled={isPending}
                onClick={() => setIsModalOpen(false)}
                className="bg-info hover:bg-button-info-hover-bg cursor-pointer rounded-xl p-2 text-white transition duration-300 ease-in-out hover:scale-105 disabled:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                name="delete"
                disabled={isPending}
                onClick={() => executeDelete(photo.$id as string)}
                className="bg-button-error-bg hover:bg-button-error-hover-bg cursor-pointer rounded-xl p-2 text-white transition duration-300 ease-in-out hover:scale-105 disabled:bg-gray-400"
              >
                Delete Photo
              </button>
            </div>
          </form>
        </div>
      </Modal>
      <h1 className="bg-neutral-light rounded-md p-2 text-2xl font-bold">
        {photo.title}
      </h1>
      <div className="m1 m-1 grid grid-cols-1 place-items-center gap-5 lg:grid-cols-2">
        <div
          ref={photoBoothRef}
          className={`grid grid-cols-1 place-items-center ${userBg} gap-2 rounded-lg border-10 border-amber-400 bg-gradient-to-br from-sky-400 via-blue-400 to-indigo-400 p-3.5 shadow-lg`}
        >
          {images.map((image, index) => (
            <div className="relative p-0.5" key={index}>
              {getCurrentSticker({
                sticker: photo.sticker as string,
                set: index + 1,
                type: "Image",
              })}
              <img
                src={image as string}
                alt={`Image ${index + 1}`}
                className={`object-cover ${userFilters}`}
                height={"300px"}
                width={"300px"}
              />
            </div>
          ))}
          <div className="w-full bg-gradient-to-br from-white via-slate-300 to-zinc-300 p-3 text-center">
            <p className="photobooth-text-italic text-lg">
              {formatDate(photo.$createdAt as string)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 place-self-center lg:place-self-start">
          <h1 className="mb-1.5 text-center text-3xl font-bold">Votes</h1>
          <div className="grid grid-cols-2 place-items-center gap-4 lg:grid-cols-1">
            <div className="flex cursor-pointer items-center justify-center gap-7">
              <button
                className="disabled:opacity-75"
                disabled={isPending}
                onClick={() => handleVote("Heart", photo.$id as string)}
              >
                <img
                  src={HeartBtn}
                  alt="heart"
                  className="h-10 w-10 cursor-pointer object-cover transition duration-300 ease-in-out hover:scale-120 lg:h-24 lg:w-24"
                  style={{
                    filter:
                      voteType === "Heart"
                        ? "drop-shadow(0 0 8px rgba(0,0,0,1))"
                        : "none",
                  }}
                />
              </button>
              <h2 className="photobooth-text-italic text-xl font-bold">
                {heartVoteCount || 0}
              </h2>
            </div>
            <div className="flex cursor-pointer items-center justify-center gap-7">
              <button
                className="disabled:opacity-75"
                disabled={isPending}
                onClick={() => handleVote("Sad", photo.$id as string)}
              >
                <img
                  src={SadBtn}
                  alt="sad"
                  className="h-14 w-14 cursor-pointer object-cover transition duration-300 ease-in-out hover:scale-120 lg:h-32 lg:w-32"
                  style={{
                    filter:
                      voteType === "Sad"
                        ? "drop-shadow(0 0 8px rgba(0,0,0,1))"
                        : "none",
                  }}
                />
              </button>
              <h2 className="photobooth-text-italic text-xl font-bold">
                {sadVoteCount || 0}
              </h2>
            </div>
            <div className="flex cursor-pointer items-center justify-center gap-7">
              <button
                className="disabled:opacity-75"
                disabled={isPending}
                onClick={() => handleVote("Wow", photo.$id as string)}
              >
                <img
                  src={WowBtn}
                  alt="wow"
                  className="h-14 w-14 cursor-pointer object-cover transition duration-300 ease-in-out hover:scale-120 lg:h-28 lg:w-28"
                  style={{
                    filter:
                      voteType === "Wow"
                        ? "drop-shadow(0 0 8px rgba(0,0,0,1))"
                        : "none",
                  }}
                />
              </button>
              <h2 className="photobooth-text-italic text-xl font-bold">
                {wowVoteCount || 0}
              </h2>
            </div>
            <div className="flex cursor-pointer items-center justify-center gap-7">
              <button
                className="disabled:opacity-75"
                disabled={isPending}
                onClick={() => handleVote("Cool", photo.$id as string)}
              >
                <img
                  src={CoolBtn}
                  alt="cool"
                  className="h-14 w-14 cursor-pointer object-cover transition duration-300 ease-in-out hover:scale-120 lg:h-32 lg:w-32"
                  style={{
                    filter:
                      voteType === "Cool"
                        ? "drop-shadow(0 0 8px rgba(0,0,0,1))"
                        : "none",
                  }}
                />
              </button>
              <h2 className="photobooth-text-italic text-xl font-bold">
                {coolVoteCount || 0}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleBack}
          className="bg-warning hover:bg-warning/85 cursor-pointer rounded px-4 py-2 text-white transition duration-300 ease-in-out hover:scale-105 disabled:bg-gray-400"
          disabled={isPending}
        >
          <img src={BackIcon} alt="Back" className="h-6 w-6" />
        </button>

        {photo.$permissions?.includes(`delete("user:${userID}")`) &&
          photo.$permissions?.includes(`update("user:${userId}")`) && (
            <>
              <button
                onClick={() => handleSave(photo.$id ?? "", photo.userID ?? "")}
                disabled={isPending}
                className="cursor-pointer rounded bg-green-500 px-4 py-2 text-white transition duration-300 ease-in-out hover:scale-105 hover:bg-green-600 disabled:bg-gradient-to-br disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400"
              >
                <img src={SaveIcon} alt="Save" className="h-6 w-6" />
              </button>
              <button
                onClick={() =>
                  handleDownload(photo.$id ?? "", photo.userID ?? "")
                }
                className="cursor-pointer rounded bg-green-500 px-4 py-2 text-white transition duration-300 ease-in-out hover:scale-105 hover:bg-green-600"
              >
                <img src={DownloadIcon} alt="Save" className="h-6 w-6" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="cursor-pointer rounded bg-red-500 px-4 py-2 text-white transition duration-300 ease-in-out hover:scale-105 hover:bg-red-600 disabled:bg-gradient-to-br disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400"
              >
                <img src={DeleteIcon} alt="Save" className="h-6 w-6" />
              </button>
            </>
          )}
      </div>
    </div>
  );
}
