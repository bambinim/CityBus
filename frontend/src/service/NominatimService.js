import requests from "@/lib/requests";

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org';

export const NominatimService = {
    async reverseGeocode(lat, lon){
        const endpoint = `${NOMINATIM_ENDPOINT}/reverse?format=json&lat=${lat}&lon=${lon}`;
        try{
            const response = await requests.get(endpoint, {authenticated: false})
            
            return response
        }catch (error) {
            console.error("Error fetching geolocation data:", error);
            throw error;
        }
    },
    async search(query) {
        try {
            const res = await requests.get(encodeURI(`${NOMINATIM_ENDPOINT}/search?q=${query}&format=json`), {authenticated: false})
            return res.data.map(el => {return {
                name: el.name,
                displayName: el.display_name,
                lat: el.lat,
                lng: el.lon
            }})
        } catch (err) {
            throw err
        }
    }

}
