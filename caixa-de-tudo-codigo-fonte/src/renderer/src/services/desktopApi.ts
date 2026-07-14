export const desktopApi = (): Window['desktopAPI'] => {
  if (!window.desktopAPI) {
    throw new Error(
      'window.desktopAPI não está disponível. Verifique se o preload foi carregado corretamente.'
    )
  }
  return window.desktopAPI
}
