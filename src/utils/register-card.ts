import { getWindow } from "./get-window";

interface RegisterCardParams {
  type: string;
  name: string;
  description: string;
}


export function registerCustomCard(params: RegisterCardParams) {
  const windowWithCards = getWindow();
  windowWithCards.customCards = windowWithCards.customCards || [];

  windowWithCards.customCards.push({
    ...params,
    preview: true,
  });
}
