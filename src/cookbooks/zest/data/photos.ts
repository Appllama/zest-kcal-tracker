import type { MealPhoto } from "./diary";
import {
  createContext,
  createElement,
  useContext,
  type PropsWithChildren,
  type ComponentProps,
} from "react";
import { Image, useImage, type ImageRef } from "expo-image";

export const mealPhotos = {
  breakfast: require("../../../../assets/cookbooks/zest/photos/breakfast.png"),
  lunch: require("../../../../assets/cookbooks/zest/photos/lunch.png"),
  dinner: require("../../../../assets/cookbooks/zest/photos/dinner.png"),
};

/** One photo identity from viewfinder through message, receipt and diary. */
export function mealPhotoSource(photo?: MealPhoto) {
  if (photo?.uri) return { uri: photo.uri };
  if (photo?.sample) return mealPhotos[photo.asset ?? "breakfast"];
  return undefined;
}

const proteinArtwork = require("../../../../assets/cookbooks/zest/stickers/eggs.svg");
const DecodedProtein = createContext<ImageRef | null>(null);
export function useProteinArtwork() {
  return useContext(DecodedProtein) ?? proteinArtwork;
}

const DecodedPhotos = createContext<
  Partial<Record<keyof typeof mealPhotos, ImageRef | null>>
>({});

/** Decode once while the welcome is visible; reuse native pixels across every meal view. */
export function MealPhotosProvider({ children }: PropsWithChildren) {
  const protein = useImage(proteinArtwork);
  const breakfast = useImage(mealPhotos.breakfast, { maxWidth: 1086 });
  const lunch = useImage(mealPhotos.lunch, { maxWidth: 1086 });
  const dinner = useImage(mealPhotos.dinner, { maxWidth: 1086 });
  return createElement(
    DecodedPhotos.Provider,
    { value: { breakfast, lunch, dinner } },
    createElement(DecodedProtein.Provider, { value: protein }, children),
  );
}

export function useMealPhotoSource(photo?: MealPhoto) {
  const decoded = useContext(DecodedPhotos);
  return photo?.sample && !photo.uri
    ? (decoded[photo.asset ?? "breakfast"] ?? mealPhotoSource(photo))
    : mealPhotoSource(photo);
}

export function MealImage({
  photo,
  ...props
}: Omit<ComponentProps<typeof Image>, "source"> & { photo?: MealPhoto }) {
  const source = useMealPhotoSource(photo);
  return createElement(Image, { ...props, source });
}
