<template>
  <div class="nav-container" ref="target">
    <nav class="navbar" :class="{ open: isMenuVisible }">
      <label class="responsive-menu" @click="toggleMenu">
        <a class="target-burger" :class="{ visible: isMenuVisible }">
          <ul class="buns">
            <li class="bun"></li>
            <li class="bun"></li>
          </ul>
        </a>
      </label>
      <div class="dropdown">
        <ul class="tab-container" :class="{ visible: isMenuVisible }">
          <router-link class="tab" to="/stats">
            Leaderboard
          </router-link>
          <router-link class="tab" to="/trades">
            Trade history
          </router-link>
          <router-link class="tab" to="/instructions">
            Instructions
          </router-link>
          <div class="tab" @click="openExportModal()" type="dark">
            Get backup
          </div>
        </ul>
      </div>
    </nav>
  </div>
</template>

<script>
import { onClickOutside } from '@vueuse/core'
import { ref } from 'vue'

export default {
  setup (props, { emit }) {
    const target = ref(null)
    const displayBox = ref(false)
    const isMenuVisible = ref(false)

    function openExportModal () {
      emit('openExportModal')
    }
    function closeMenu () {
      isMenuVisible.value = false
    }
    function toggleMenu () {
      isMenuVisible.value = !isMenuVisible.value
    }
    function displayDropDown () {
      displayBox.value = !displayBox.value
    }
    onClickOutside(target, event => {
      if (isMenuVisible.value) {
        closeMenu()
      }
    })

    return {
      target,
      ref,
      displayDropDown,
      toggleMenu,
      closeMenu,
      openExportModal,
      isMenuVisible,
      displayBox
    }
  }
}
</script>

<style scoped lang="scss">
.navbar-container {
  position: absolute;
}
.navbar {
  display: block;
  top: 8px;
  left: 8px;
  padding: 0;
  .logo-container {
    display: grid;
    grid-template-columns: max-content max-content;
    grid-template-rows: 1fr 1fr;
    align-items: center;
    padding: 8px;
    text-decoration: none;
    column-gap: 8px;

    .witnet-logo {
      width: 90px;
      grid-row: 1 / span 2;
    }
    .logo-subtitle-color {
      font-size: 18px;
      align-self: flex-start;
      color: var(--primary-color);
    }
    .logo-subtitle {
      font-size: 18px;
      align-self: flex-end;
      color: var(--primary-color);
    }
  }
  .responsive-menu {
    display: block;
    position: absolute;
    z-index: 50px;
    top: 24px;
    width: 32px;
    left: 16px;
  }
  .dropdown {
    position: absolute;
    z-index: 50;
    top: 68px;
  }
}
.tab-container {
  background-color: $white;
  border: 2px solid var(--primary-color);
  list-style: none;
  visibility: hidden;
  text-align: left;
  border-radius: 4px;
  margin: 0;
  display: grid;
  opacity: 0;
  width: 0px;
  height: 0px;
  &.visible {
    box-sizing: border-box;
    transition: all 0.1s;
    visibility: visible;
    padding: 8px 0px;
    top: 8px;
    opacity: 1;
    width: 148px;
    height: 174px;
    .tab {
      cursor: pointer;
      opacity: 1;
      transition: all 0.3s;
    }
  }
  .list-item {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .tab {
    width: 148px;
    cursor: pointer;
    display: block;
    align-items: left;
    text-decoration: none;
    padding: 0px 16px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    color: var(--primary-color);
    font-size: 18px;
    font-weight: 600;
    opacity: 0;
    .btn {
      max-width: max-content;
      margin: 0;
      top: 0px;
      left: 16px;
    }

    &:hover {
      color: var(--primary-color);
    }
  }
}
.target-burger {
  display: block;
  transition: 0.5s;
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover {
    cursor: pointer;
    opacity: opacity(0.45);
  }
  &.visible {
    ul.buns {
      width: 32px;
      height: 32px;
      li.bun {
        -webkit-transform: rotate(45deg) translateZ(0);
        transform: rotate(45deg) translateZ(0);
        &:last-child {
          -webkit-transform: rotate(-45deg) translateZ(0);
          transform: rotate(-45deg) translateZ(0);
        }
      }
    }
  }
  .buns {
    width: 32px;
    height: 32px;
    list-style: none;
    padding: 0;
    -webkit-transition: -webkit-transform 1s cubic-bezier(0.23, 1, 0.32, 1),
      color 1s cubic-bezier(0.23, 1, 0.32, 1);
    transition: transform 1s cubic-bezier(0.23, 1, 0.32, 1),
      color 1s cubic-bezier(0.23, 1, 0.32, 1);
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    color: var(--primary-color);
    .bun {
      width: 100%;
      height: 3px;
      background-color: var(--primary-color);
      position: absolute;
      top: 50%;
      margin-top: -0.75px;
      -webkit-transform: translateY(-3.75px) translateZ(0);
      transform: translateY(-3.75px) translateZ(0);
      -webkit-transition: -webkit-transform 1s cubic-bezier(0.23, 1, 0.32, 1),
        background-color 1s cubic-bezier(0.23, 1, 0.32, 1);
      transition: transform 1s cubic-bezier(0.23, 1, 0.32, 1),
        background-color 1s cubic-bezier(0.23, 1, 0.32, 1);
      &:last-child {
        -webkit-transform: translateY(3.75px) translateZ(0);
        transform: translateY(3.75px) translateZ(0);
      }
    }
  }
}
</style>
