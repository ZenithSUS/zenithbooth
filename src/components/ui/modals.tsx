import Modal from "react-modal";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useRef, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { UserFilters, ShareType } from "../../utils/types.ts";
import { useNavigate } from "react-router-dom";
import {
  MAX_FILE_SIZE,
  ACCEPTED_IMAGE_TYPES,
} from "../../utils/constants/image-file.ts";
import changePassword from "../../utils/functions/change-password";
import changeImage from "../../utils/functions/change-image.ts";
import shareImages from "../../utils/functions/share.ts";
import unknown from "../../assets/ui/unknown.jpg";

Modal.setAppElement("#root");

type ModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shareData?: ShareType;
};

const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    newPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const changeImageSchema = z.object({
  image: z
    .instanceof(FileList)
    .refine(
      (files) => files.length === 0 || files.length === 1,
      "Please upload exactly one file",
    )
    .refine(
      (files) => files.length === 0 || files[0].size <= MAX_FILE_SIZE,
      `Max file size is 5MB`,
    )
    .refine(
      (files) =>
        files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
      "Only .jpg, .jpeg, and .png formats are supported",
    ),
});

type changePasswordSchemaType = z.infer<typeof changePasswordSchema>;
type changeImageSchemaType = z.infer<typeof changeImageSchema>;

export function ChangePasswordModal({
  isModalOpen,
  setIsModalOpen,
}: ModalProps) {
  const [isPending, startTransition] = useTransition();
  const handleChangePassword = async (data: changePasswordSchemaType) => {
    try {
      if (!data.oldPassword || !data.confirmPassword) return;
      startTransition(async () => {
        await changePassword(data.oldPassword, data.newPassword);
      });
      setIsModalOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error("There is something changing your password");
    }
  };

  const form = useForm<changePasswordSchemaType>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      confirmPassword: "",
    },
  });

  return (
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
        <form
          onSubmit={form.handleSubmit(handleChangePassword)}
          className="bg-primary-light grid grid-cols-1 place-items-center rounded-2xl p-4"
        >
          <h2 className="text-center text-lg font-bold">Change Password</h2>
          <div className="flex w-full flex-col gap-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="oldpassword" className="text-lg font-bold">
                Old Password
              </label>
              <input
                type="password"
                id="oldpassword"
                autoComplete="off"
                {...form.register("oldPassword")}
                className="w-full rounded-sm bg-white p-2 shadow-md ring-2 ring-black/55"
              />
              {form.formState.errors.oldPassword ? (
                <span className="h-7 text-red-500">
                  {form.formState.errors.oldPassword.message}
                </span>
              ) : (
                <span className="h-7"></span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="newpassword" className="text-lg font-bold">
                New Password
              </label>
              <input
                type="password"
                id="newpassword"
                autoComplete="off"
                {...form.register("newPassword")}
                className="w-full rounded-sm bg-white p-2 shadow-md ring-2 ring-black/55"
              />
              {form.formState.errors.newPassword ? (
                <span className="h-7 text-red-500">
                  {form.formState.errors.newPassword.message}
                </span>
              ) : (
                <span className="h-7"></span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="confirmpassword" className="text-lg font-bold">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmpassword"
                autoComplete="off"
                {...form.register("confirmPassword")}
                className="w-full rounded-sm bg-white p-2 shadow-md ring-2 ring-black/55"
              />
              {form.formState.errors.confirmPassword ? (
                <span className="h-7 text-red-500">
                  {form.formState.errors.confirmPassword.message}
                </span>
              ) : (
                <span className="h-7"></span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="bg-button-success-bg hover:bg-button-success-hover-bg text-button-accent-text hover:text-button-accent-hover-text cursor-pointer rounded-xl p-2 transition duration-300 ease-in-out hover:scale-105 disabled:bg-gray-400"
              >
                Submit
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsModalOpen(false)}
                className="bg-info hover:bg-button-info-hover-bg cursor-pointer rounded-xl p-2 text-white transition duration-300 ease-in-out hover:scale-105 disabled:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function ShareModal({
  isModalOpen,
  setIsModalOpen,
  shareData,
}: ModalProps) {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  let userFilters: UserFilters[] = [];
  const title = useRef<HTMLInputElement>(null);
  const shareImage = async (e: React.FormEvent, title: string) => {
    try {
      e.preventDefault();
      if (!shareData) return;

      if (title.length === 0) {
        toast.error("Please enter a title");
        return;
      }

      userFilters = Object.values(shareData.filterValues).map((f) => String(f));

      startTransition(async () => {
        await shareImages(
          shareData.capturedImage as Blob[],
          shareData.setCapturedImage,
          shareData.setFilterValues,
          shareData.setFilter,
          shareData.setPrevFilter,
          shareData.setSticker,
          shareData.setBorderValue,
          shareData.setBackgroundValue,
          shareData.setBorderColor,
          shareData.setBackgroundColor,
          setIsModalOpen,
          shareData.name,
          title,
          shareData.sticker,
          shareData.backgroundValue,
          shareData.borderValue,
          userFilters,
        );
      });

      return navigate("/");
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <Modal
      isOpen={isModalOpen}
      parentSelector={() => document.querySelector("#root") as HTMLElement}
      className={
        "absolute top-1/8 z-50 mx-auto grid w-full max-w-lg place-items-center p-4 sm:inset-x-8 sm:top-1/4 sm:max-w-md md:max-w-lg lg:max-w-xl"
      }
      overlayClassName={
        "fixed inset-0 z-40 bg-black/50 bg-opacity-50 backdrop-blur-sm"
      }
    >
      <div className="flex w-full flex-col">
        <form
          onSubmit={(e) => shareImage(e, title.current?.value as string)}
          className="bg-primary grid grid-cols-1 place-items-center rounded-2xl p-4"
        >
          <h2 className="text-center text-lg font-bold">Share PhotoBooth</h2>
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="title" className="text-lg font-bold">
              PhotoBooth Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              autoComplete="off"
              ref={title}
              className="w-full rounded-sm bg-white p-2"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="submit"
                name="share"
                disabled={isPending}
                className="bg-button-success-bg hover:bg-button-success-hover-bg text-button-accent-text hover:text-button-accent-hover-text cursor-pointer rounded-xl p-2 transition duration-300 ease-in-out hover:scale-105 disabled:bg-gray-400"
              >
                Share
              </button>
              <button
                type="button"
                name="cancel"
                disabled={isPending}
                onClick={() => setIsModalOpen(false)}
                className="bg-info hover:bg-button-info-hover-bg cursor-pointer rounded-xl p-2 text-white transition duration-300 ease-in-out hover:scale-105 disabled:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function ChangeProfileModal({
  isModalOpen,
  setIsModalOpen,
}: ModalProps) {
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string>("No file chosen");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<changeImageSchemaType>({
    resolver: zodResolver(changeImageSchema),
    mode: "onChange",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleChangeImage = async (data: changeImageSchemaType) => {
    try {
      if (data.image instanceof FileList) {
        startTransition(async () => {
          await changeImage(data.image[0] as File);
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!isModalOpen) {
      setImagePreview(null);
    }
  }, [isModalOpen]);

  const currentProfileImage = JSON.parse(
    localStorage.getItem("profileImage") || '"N/A"',
  );

  return (
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
        <form
          onSubmit={form.handleSubmit(handleChangeImage)}
          className="bg-primary-light grid grid-cols-1 place-items-center rounded-2xl p-4 shadow-md shadow-black/50"
        >
          <h2 className="text-center text-lg font-bold">Change Profile</h2>

          <img
            src={
              imagePreview || currentProfileImage !== "N/A"
                ? imagePreview || currentProfileImage
                : unknown || unknown
            }
            alt="profile"
            className="m-auto mt-4 mb-2 h-32 w-32 rounded-full object-cover"
          />

          <div className="flex w-full flex-col gap-2">
            <div className="flex">
              <label
                htmlFor="image"
                className="bg-secondary-dark hover:bg-secondary-darker/80 flex cursor-pointer items-center rounded-l-md px-4 py-2 font-medium text-white transition duration-300 ease-in-out hover:scale-105"
              >
                Profile Image
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                className="hidden"
                {...form.register("image")}
                onChange={(e) => {
                  form.register("image").onChange(e);
                  setFileName(
                    e.target.files && e.target.files[0]
                      ? e.target.files[0].name
                      : "No file chosen",
                  );
                  handleImageChange(e);
                }}
              />
              <span className="flex w-full items-center rounded-r-md border border-gray-300 bg-white px-3 py-2">
                {fileName as string}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="submit"
                name="change"
                className="bg-button-success-bg hover:bg-button-success-hover-bg text-button-accent-text hover:text-button-accent-hover-text cursor-pointer rounded-xl p-2 transition duration-300 ease-in-out hover:scale-105 disabled:bg-gray-400"
                disabled={isPending}
              >
                Change Profile
              </button>
              <button
                type="button"
                name="cancel"
                className="bg-info hover:bg-button-info-hover-bg cursor-pointer rounded-xl p-2 text-white transition duration-300 ease-in-out hover:scale-105 disabled:bg-gray-400"
                disabled={isPending}
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
