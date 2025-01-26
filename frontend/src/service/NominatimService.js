import requests from "@/lib/requests";


export const NominatimService = {
    async reverseGeocode(lat, lon){
        const endpoint = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

        try{
            const response = await requests.get(endpoint, {authenticated: true})
            
            return response
        }catch (error) {
            console.error("Error fetching geolocation data:", error);
            throw error;
        }

    }
}
