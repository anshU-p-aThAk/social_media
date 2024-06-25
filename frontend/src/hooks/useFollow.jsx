import toast from "react-hot-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"

const useFollow = () => {
    
    const queryClient = useQueryClient();

    const {mutate: follow, isPending} = useMutation({
        mutationFn: async(userId) => {
           try {

            const res = await fetch(`/api/users/follow/${userId}`, {
                method: "POST"
            })

            const data = await res.json();

            if(!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            return;
            
           } catch (error) {
                throw new Error(error);
           }
        },
        onSuccess: () => {
            Promise.all([ // to invalidate queries in parallel
                queryClient.invalidateQueries({queryKey: ["suggestedUsers"]}),                queryClient.invalidateQueries({queryKey: ["suggestedUsers"]}),
                queryClient.invalidateQueries({queryKey: ["authUser"]}),

            ])
        },
        onError: (error) => {
            toast.error(error.message);
        }
    })

    return {follow, isPending};
}

export default useFollow;