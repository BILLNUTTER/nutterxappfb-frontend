import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiFetch, parseWithLogging } from "@/lib/api";

export function usePosts() {
  return useQuery({
    queryKey: [api.posts.list.path],

    queryFn: async () => {
      const data = await apiFetch(api.posts.list.path);

      try {
        const parsed = parseWithLogging(
          api.posts.list.responses[200],
          data,
          "posts.list"
        );

        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error("Posts parse failed, using raw data:", err);

        // fallback so feed never becomes empty
        return Array.isArray(data) ? data : data?.data || [];
      }
    },

    staleTime: 1000 * 30,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content: string }) => {
      const res = await apiFetch(api.posts.create.path, {
        method: "POST",
        body: JSON.stringify(data),
      });

      try {
        return parseWithLogging(
          api.posts.create.responses[201],
          res,
          "posts.create"
        );
      } catch {
        return res;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [api.posts.list.path],
      });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.posts.like.path, { id });

      const data = await apiFetch(url, {
        method: "POST",
      });

      try {
        return parseWithLogging(
          api.posts.like.responses[200],
          data,
          "posts.like"
        );
      } catch {
        return data;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [api.posts.list.path],
      });
    },
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: [api.comments.list.path, postId],

    queryFn: async () => {
      const url = buildUrl(api.comments.list.path, { postId });

      const data = await apiFetch(url);

      try {
        const parsed = parseWithLogging(
          api.comments.list.responses[200],
          data,
          "comments.list"
        );

        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return Array.isArray(data) ? data : [];
      }
    },

    enabled: !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
    }: {
      postId: string;
      content: string;
    }) => {
      const url = buildUrl(api.comments.create.path, { postId });

      const data = await apiFetch(url, {
        method: "POST",
        body: JSON.stringify({ content }),
      });

      try {
        return parseWithLogging(
          api.comments.create.responses[201],
          data,
          "comments.create"
        );
      } catch {
        return data;
      }
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.comments.list.path, variables.postId],
      });
    },
  });
}
