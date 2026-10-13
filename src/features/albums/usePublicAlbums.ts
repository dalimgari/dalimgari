import { useEffect, useState } from "react";
import { getPublicAlbums, type PublicAlbum } from "../../services/content";

interface AlbumState {
  albums: PublicAlbum[];
  loading: boolean;
  error: string | null;
}

export function usePublicAlbums(): AlbumState {
  const [state, setState] = useState<AlbumState>({ albums: [], loading: true, error: null });

  useEffect(() => {
    let active = true;
    getPublicAlbums()
      .then((albums) => {
        if (active) setState({ albums, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          albums: [],
          loading: false,
          error: error instanceof Error ? error.message : "Could not load albums.",
        });
      });
    return () => { active = false; };
  }, []);

  return state;
}
