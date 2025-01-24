<script setup>
import { ref } from "vue";
import { faCompass, faMap, faRoad, faClock, faBus, faUser, faRightFromBracket, faGear, faUsers } from '@fortawesome/free-solid-svg-icons'

const menuBarItems = ref([
    {label: 'Cerca percorso', icon: faCompass},
    {label: 'Partenze', icon: faClock},
    {label: 'Cerca linea', icon: faBus},
    {label: 'Amministrazione', icon: faGear, items: [
        {label: 'Mappa', icon: faMap},
        {label: 'Linee', icon: faRoad},
        {label: 'Utenti', icon: faUsers}
    ]}
]);

const userMenuItems = ref([
    {label: 'Profilo', icon: faUser},
    {label: 'Logout', icon: faRightFromBracket}
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
                <Avatar shape="circle" label="MB" />
            </button>
        </template>
    </Menubar>
    <Menu ref="menu" :popup="true" id="userMenu" :model="userMenuItems">
        <template #itemicon="itemProps">
            <font-awesome-icon v-if="itemProps.item.icon" :icon="itemProps.item.icon"/>
        </template>
    </Menu>
</template>
