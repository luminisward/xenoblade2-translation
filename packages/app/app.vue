<template>
  <Head>
    <Title>{{ keywords ? `${keywords} - ${$t('title')}` : $t('title') }}</Title>
  </Head>
  <div class="h-dvh flex flex-col">
    <header class="px-4 flex items-center justify-between shrink-0 h-12 border-b border-slate-100/10 bg-neutral-900">
      <div class="text-lg font-medium">{{ $t('title') }}</div>
      <div>
        <Button text icon="pi pi-language" @click="toggle" />
        <Menu
          ref="menu"
          :model="[
            { label: 'English', command: () => (i18n = 'en') },
            { label: '简体中文', command: () => (i18n = 'zh-hans') },
          ]"
          :popup="true"
          :pt="{ root: 'min-w-0' }"
        />
      </div>
    </header>
    <div class="px-4 mt-4 mb-2 flex gap-3 flex-wrap sm:flex-nowrap">
      <Dropdown
        v-model="queryLanguage"
        option-label="name"
        option-value="code"
        :options="languages.map((l) => ({ name: $t(l), code: l }))"
        :placeholder="$t('queryLanguage')"
        class="w-full sm:w-auto"
      />
      <InputText ref="keywordsInput" v-model="keywords" class="flex-1" />
    </div>
    <Fieldset toggleable :legend="$t('resultLanguages')" class="mx-4 mb-4">
      <div class="flex flex-wrap gap-3">
        <div v-for="language of languages" :key="language" class="flex items-center">
          <Checkbox
            :model-value="resultLanguages"
            :value="language"
            :input-id="'r' + language"
            @update:model-value="resultLanguages = languages.filter((l) => $event.includes(l))"
          />
          <label :for="'r' + language" class="ml-2">{{ $t(language) }}</label>
        </div>
      </div>
    </Fieldset>
    <DataTable
      resizable-columns
      show-gridlines
      column-resize-mode="expand"
      row-group-mode="rowspan"
      :group-rows-by="columns[0].field"
      :value="searchResults"
      scrollable
      scroll-height="flex"
      class="overflow-hidden mx-4 shadow"
      :pt="{ root: 'bg-transparent' }"
    >
      <Column
        v-for="col of columns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        class="whitespace-pre"
      ></Column>
      <template #empty> </template>
    </DataTable>
    <Paginator
      v-model:first="offset"
      v-model:rows="limit"
      :pt="{
        root: 'bg-transparent',
      }"
      :rows-per-page-options="[10, 50, 100]"
      :total-records="count!"
    />
  </div>
</template>

<script lang="ts" setup>
import { languages } from 'bdat'
import type { LocationQueryValue } from 'vue-router'
type Language = (typeof languages)[number]

const route = useRoute()
const router = useRouter()

const useQuery = (key: string) => {
  return computed<LocationQueryValue>({
    get: () => {
      const value = route.query[key]
      if (Array.isArray(value)) {
        throw new TypeError('Array is not supported')
      }
      return value
    },
    set: (value) => {
      router.push({ query: { ...route.query, [key]: value || undefined } })
    },
  })
}

const keywords = useQuery('k')

const { locale, t } = useI18n()
const queryLanguage = useCookie<Language>('queryLanguage', {
  default() {
    if (locale.value === 'zh-hans') {
      return 'cn'
    } else {
      return 'gb'
    }
  },
})
const resultLanguages = useCookie<Language[]>('resultLanguages', {
  default: () => [...languages],
})

const i18nCookie = useCookie<string | undefined>('i18n')

const detectedLocale = locale.value
if (i18nCookie.value) {
  locale.value = i18nCookie.value
}
const i18n = computed<string>({
  get: () => i18nCookie.value || locale.value,
  set: (value: string) => {
    if (locale.value === value) {
      return
    }
    if (detectedLocale === value) {
      i18nCookie.value = undefined
    } else {
      i18nCookie.value = value
    }
    locale.value = value
  },
})

const menu = ref()
const toggle = (event: any) => {
  menu.value.toggle(event)
}

const offset = ref(0)
const limit = ref(10)
const debouncedKeywords = useDebounce(keywords, 50)
const trimKeywords = computed(() => debouncedKeywords.value?.trim())

const { data: searchResults } = useFetch('/api/search', {
  query: { ql: queryLanguage, rl: resultLanguages, k: trimKeywords, offset, limit },
})
const { data: count } = useFetch('/api/search/count', {
  query: { ql: queryLanguage, k: trimKeywords },
})

const columns = computed(() => {
  const fields = ['file', 'id', ...resultLanguages.value]
  return fields.map((field) => {
    return {
      field,
      header: t(field),
    }
  })
})
const keywordsInput = ref()
useFocus(keywordsInput, { initialValue: true })
</script>

<style>
body {
  background-image: url('~/assets/bg.jpg');
}
</style>
