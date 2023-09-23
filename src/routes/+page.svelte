
<script lang="ts">
    export const config = {
        runtime: 'edge'
    };
    import onboard from '../lib/wallet_manager';
    import injectedModule from '@web3-onboard/injected-wallets'
    import SignMessage from '../components/SignMessage.svelte'

    $: wallets = onboard.state.select('wallets');

    const verify = async (rawMessage, signature) => {
        //ethers.utils.verifyMessage(rawMessage, signature);
    }

    const connect = async () => {
        await onboard.connectWallet()
    }

</script>

<div class="h-screen w-full py-10 px-8 flex flex-col justify-between">
    <header>
        <h1 class="text-center text-4xl text-yellow-200">Herramienta de firma con wallet integrada</h1>
        <h2 class="text-center text-lg">Conecte su wallet para firmar un mensaje y obtener los datos para registrar su wallet en BFA</h2>
    </header>
    {#if $wallets?.[0]?.provider }
        <SignMessage wallets={wallets} />

    {:else}
        <div class="justify-center text-center">
            <button
                class="p-8 text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800 font-medium rounded-lg text-md px-8 py-5 text-center mr-2 mb-2"
                on:click={connect}
            >
                Conectar wallet
            </button>
        </div>
    {/if}
    <section class="flex flex-col align-center justify-center mx-auto space-y-6">
        <h3 class="text-center text-2xl text-yellow-200">Para qué todo esto?</h3>
        <ul class="space-y-2 justify-center">
            <li class="flex items-center">
                <svg class="w-3.5 h-3.5 mr-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
                </svg>
                <span class="ml-2 italic">Facilita el registro de las personas en la BFA</span>
            </li>
            <li class="flex items-center">
                <svg class="w-3.5 h-3.5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
                </svg>
                <span class="ml-2 italic">El proceso oficial es menos accesible, requiere instalar herramientas y utilizar scripts.</span>
            </li>
            <li class="flex items-center">
                <svg class="w-3.5 h-3.5 mr-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
                </svg>
                <span class="ml-2 italic">Puede utilizar su wallet de Metamask y registrar los datos en el sitio web oficial de BFA</span>
            </li>
        </ul>
    </section>
</div>
