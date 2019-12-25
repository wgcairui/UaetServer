<template>
  <b-container fluid class=" w-100 p-0">
    <b-navbar toggleable="lg" type="dark" variant="info">
      <b-navbar-brand href="#">透传服务器运行状态</b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item :to="{ name: 'admin-index-NodeInfo' }">节点</b-nav-item>
          <b-nav-item :to="{ name: 'admin-index-TerminalInfo' }"
            >Terminal</b-nav-item
          >
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-item-dropdown right>
            <!-- Using 'button-content' slot -->
            <template v-slot:button-content>
              <em>User</em>
            </template>
            <b-dropdown-item href="#">Profile</b-dropdown-item>
            <b-dropdown-item href="#">Sign Out</b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <b-row no-gutters>
      <nuxt class="w-100" />
    </b-row>
  </b-container>
</template>
