<script>
    import { onMount, afterUpdate } from 'svelte';
    import { ethers } from 'ethers'
    export let wallets
    export let onboard

    let wallet
    let signature = "";
    let message = "";
    let error;
    let loading = false

    const sign = async () => {
        signature = ""
        const ethersProvider = new ethers.providers.Web3Provider($wallets[0].provider, 'any')
        const signer = ethersProvider.getSigner();
        loading = true;

        signer.signMessage(message).then((signedMessage) => {
            signature = signedMessage;
            loading = false
        }).catch(() => {
            loading = false
            error = "Hubo un problema al firmar el mensaje";
            setTimeout(() => {
                error = undefined;
            }, 1500)
        });
    }

    const setWallet = () =>{
        wallet = $wallets?.[0]?.accounts[0].address;
    }
    afterUpdate(async () => {
        if($wallets?.[0]?.accounts[0]) {
            setWallet()
        }
    })
</script>

<div class="max-w-2xl mx-auto text-center">
    <div>
        <label for="message" class="block mb-2 text-md font-medium text-gray-900 dark:text-gray-400">Si desea, ingrese un mensaje a firmar <span class="text-red-400 text-sm"> (es opcional) </span></label>
        <textarea bind:value={message} id="message" rows="2" class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder=""></textarea>
    </div>
    {#if error === undefined && !loading}
        <button on:click={sign} class="mt-5 text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2 text-center mr-2 mb-2">
            Haga click para firmar
        </button>
    {:else if loading }
        <div role="status" class="flex justify-center">
            <svg aria-hidden="true" class="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span class="sr-only">Loading...</span>
        </div>
    {:else}
        <p class="text-sm text-red-400">{error}</p>
    {/if}
    <label class="mt-8 block mb-2 text-md font-medium text-gray-900 dark:text-gray-400">Firma:
    <textarea bind:value={signature} disabled rows="4" class="mt-2 block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Aquí aparecerá la firma"></textarea></label>
    <div class="mt-2 text-sm text-gray-300 dark:text-gray-500">
        <p>Wallet conectada:</p>
        <p>{wallet}</p>
        
    </div>
</div>
