<script setup>
import { ref, computed } from "vue";
import { faCompass, faMap, faRoad, faClock, faBus, faUser, faRightFromBracket, faGear, faUsers } from '@fortawesome/free-solid-svg-icons'
import { useUserStore } from '@/stores/user'
import { useAuthenticationStore } from '@/stores/authentication';
import { AuthenticationService } from '@/service/AuthenticationService';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const authStore = useAuthenticationStore();
const router = useRouter();

const menuBarItems = computed(() => {
    const items = [
        {label: 'Cerca percorso', icon: faCompass},
        {label: 'Partenze', icon: faClock},
        {label: 'Cerca linea', icon: faBus}
    ]
    if (userStore.role == 'admin') {
        items.push({label: 'Amministrazione', icon: faGear, items: [
            {label: 'Mappa', icon: faMap, command: () => router.push('/rides-map')},
            {label: 'Linee', icon: faRoad},
            {label: 'Utenti', icon: faUsers}
        ]})
    }
    return items;
});

const logoutFunction = () => {
    AuthenticationService.logout();
    authStore.deleteTokens();
    // using go the page is reloaded; no need to reset user store
    router.go('/login');
};

const userMenuItems = ref([
    {label: 'Profilo', icon: faUser},
    {label: 'Logout', icon: faRightFromBracket, command: logoutFunction}
]);

const menu = ref();

const toggle = (event) => {
    menu.value.toggle(event);
};

</script>
<template>
    <Menubar :model="menuBarItems">
        <template #itemicon="itemProps">
            <font-awesome-icon v-if="itemProps.item.icon" :icon="itemProps.item.icon"/>
        </template>
        <template #end>
            <button type="button" @click="toggle" aria-haspopup="true" aria-controls="userMenu">
                <Avatar shape="circle" :label="`${userStore.name.first.substring(0, 1)}${userStore.name.last.substring(0, 1)}`" />
            </button>
        </template>
    </Menubar>
    <Menu ref="menu" :popup="true" id="userMenu" :model="userMenuItems">
        <template #itemicon="itemProps">
            <font-awesome-icon :icon="itemProps.item.icon"/>
        </template>
    </Menu>
</template>
