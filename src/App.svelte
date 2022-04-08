<script lang="ts">

  // TO learn : bind value, input value & parameter !==
  // TO learn ! pb when created new ts file (class, handle methods, ...)
  // Svelte does'nt handle method on logic condition, pb de refactor

  import { fade } from 'svelte/transition';
  import { SECTOR } from "./enum/sector";
  import { CONTRACT } from "./enum/contract";
  import CSVDownloader from "./CSVDownloader.svelte";
  import { GAME_OVER_HL, GAME_OVER_LOCATION, GAME_OVER_LOCATION_REMOTE, GAME_OVER_SECTOR } from "./const";
  import About from "./About.svelte";

  // Steps
  let p1Name: boolean = true;
  let p1InvalidName: boolean = false;
  let p1Explication: boolean = false;
  let p2Sector: boolean = false;
  let p2Contract: boolean = false;
  let p2Remote: boolean = false;
  let p2RemoteVal: number = 3;
  let p2Location: boolean = false
  let p2InvalidLocation: boolean = false;
  let p2LocationRemoteDilemma: boolean = false;
  let p3HL: boolean = false;
  let p9GameOver: boolean = false;
  let p9GameOverExplanation: string = "";
  let p9Result: boolean = false;
  let progressBar: number = 0;
  const progressBarTotalSteps: number = 8;

  // Job infos
  let employerName: string;
  let sector: SECTOR;
  let contract: CONTRACT;
  let remote: number;
  let location: string;
  let locationRemoteDilemma: boolean;
  let HLTimeDilemma: boolean = false;

  function incrementProgressBar() {
    progressBar += 100 / progressBarTotalSteps;
  }

  function finishProgressBar() {
    progressBar = 100;
  }

  function initGameOver(reason: string) {
    p9GameOverExplanation = reason;
    p9GameOver = true;
    progressBar = 100;
  }

  function handleP1Name(): void {
    if (!employerName || employerName.length < 3) {
      p1InvalidName = true;
    } else {
      p1Name = false;
      p1Explication = true;
      incrementProgressBar();
    }
  }

  function handleP1Explication(): void {
    p1Explication = false;
    p2Sector = true;
    incrementProgressBar();
  }

  function handleP2Sector(val: SECTOR): void {
    sector = val;
    p2Sector = false;
    if (val === SECTOR.GOOD || val === SECTOR.NEUTRAL) {
      p2Sector = false;
      p2Contract = true;
      incrementProgressBar();
    } else
      initGameOver(GAME_OVER_SECTOR);
  }

  function handleP2Contract(val: CONTRACT): void {
    contract = val;
    p2Contract = false;
    p2Remote = true;
    incrementProgressBar();
  }

  function handleP2Remote(val: number): void {
    remote = val;
    p2Remote = false;
    p2Location = true;
    incrementProgressBar();
  }

  function handleP2Location(val: string): void {
    if (!val || (val !== "44" && val.length < 3)) {
      p2InvalidLocation = true;
    } else {
      location = val;
      p2Location = false;
      if (val !== "44" && remote < 2)
        initGameOver(GAME_OVER_LOCATION)
      else if (val !== "44" && remote < 4) {
        locationRemoteDilemma = true;
        p2LocationRemoteDilemma = true;
      } else {
        if (contract === CONTRACT.FULL_TIME) {
          p3HL = true;
        } else {
          p9Result = true;
        }
        finishProgressBar();
      }
    }
  }

  function handleP2locationRemoteDilemma(answer: boolean): void {
    p2LocationRemoteDilemma = false;
    if (answer) {
      remote = 4;
      if (contract === CONTRACT.FULL_TIME) {
        p3HL = true;
      } else {
        p9Result = true;
      }
      finishProgressBar();
    } else
      initGameOver(GAME_OVER_LOCATION_REMOTE);
  }

  function handleP3HL(val: string): void {
    p3HL = false;
    if (!val) {
      initGameOver(GAME_OVER_HL);
    } else {
      HLTimeDilemma = true;
      finishProgressBar();
      p9Result = true;
    }
  }
</script>

<div class="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
    <main class="3px">
        {#if p1Name}
            <div out:fade="{{delay: 0, duration: 500}}">
                <h1 class="pb-4 mb-5 border-bottom border-primary">Bonjour</h1>
                <div class="row">
                    <p class="lead">Merci de renseigner votre nom ou celui de votre entreprise</p>
                    <input bind:value={employerName}
                           type="text" class="form-control"
                           placeholder="Nom">
                    <button class="mt-3 btn btn-outline-primary" type="button" on:click={handleP1Name}>Valider
                    </button>
                    {#if p1InvalidName}
                        <div class="mt-3 alert alert-danger" role="alert">
                            Merci de remplir votre nom<br>
                            Aucune donnée n'est conservée sur ce site
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        {#if p1Explication}
            <div in:fade="{{ delay: 500 , duration: 1000 }}" out:fade="{{delay: 0, duration: 500}}">
                <h1 class="pb-4 mb-5 border-bottom border-primary">Bienvenue {employerName} !</h1>
                <div class="row">
                    <p class="lead">Avant de vous parler un peu plus de moi, je souhaiterais savoir un peu plus ce que
                        vous me proposez.</p>
                    <p class="lead">Cela vous fera gagner du temps, car si le type d'emploi que vous me proposez ne me
                        convient pas nous le saurons très rapidement.</p>
                    <button type="button" class="mt-3 btn btn-outline-primary" on:click={handleP1Explication}>
                        Commencer (2~5 min)
                    </button>
                </div>
            </div>
        {/if}

        {#if p2Sector}
            <div in:fade="{{ delay: 500 , duration: 1000 }}" out:fade="{{delay: 0, duration: 500}}">
                <h1 class="pb-4 mb-5 border-bottom border-primary">Quel est votre secteur d'activité ?</h1>
                <p class="lead"><i>La matrice utilisée ici, pour classer les secteurs d'activités, est totalement
                    subjective et n'a pas vocation à stigmatiser qui que ce soit.</i>
                </p>
                <div class="d-grid gap-lg-4 col-12 mx-auto">
                    <button class="btn btn-outline-primary" on:click={() => handleP2Sector(SECTOR.GOOD)}>Economie
                        Sociale & Solidaire, Transition Ecologique, Social, Service Publique, ...
                    </button>
                    <button class="btn btn-outline-primary" on:click={() => handleP2Sector(SECTOR.BAD)}>Banque, Finance,
                        Energie Fossile, Armement, Tourisme de masse, ...
                    </button>
                    <button class="btn btn-outline-primary" on:click={() => handleP2Sector(SECTOR.NEUTRAL)}>Autre
                    </button>
                </div>
            </div>
        {/if}


        {#if p2Contract}
            <div in:fade="{{ delay: 500 , duration: 1000 }}" out:fade="{{delay: 0, duration: 500}}">
                <h1 class="pb-4 mb-5 border-bottom border-primary">Quel type de contrat ?</h1>
                <div class="d-grid gap-sm-4 col-12 mx-auto">
                    <button class="btn btn-outline-primary" on:click={() => handleP2Contract(CONTRACT.FULL_TIME)}>
                        Temps plein
                    </button>
                    <button class="btn btn-outline-primary" on:click={() => handleP2Contract(CONTRACT.PART_TIME)}>
                        Temps partiel
                    </button>
                    <button class="btn btn-outline-primary" on:click={() => handleP2Contract(CONTRACT.FREELANCE)}>
                        Freelance
                    </button>
                </div>
            </div>
        {/if}

        {#if p2Remote}
            <div in:fade="{{ delay: 500 , duration: 1000 }}" out:fade="{{delay: 0, duration: 500}}">
                <h1 class="pb-4 mb-5 border-bottom border-primary">Quelle est votre politique de télétravail ?</h1>
                <div class="row">
                    <p class="lead">Il s'agit d'une <b>moyenne hebdomadaire</b> du nombre de <b>journées
                        télétravaillées.</b></p>
                    <p class="lead"><i>Si par exemple vous travaillez avec des sprints de trois semaines et que vous
                        souhaitez que l'équipe se réunisse deux jours consécutifs pour des cérémonies vous pouvez
                        sélectionner 4j/5.</i></p>
                    {#if contract === CONTRACT.PART_TIME}
                        <div class="mt-3 alert alert-warning" role="alert">
                            Cas particulier du temps partiel : Merci de faire au prorata sur une semaine de 5j
                            <i> (désolé je n'ai pas codé ce cas particulier #80/20)</i>.
                        </div>
                    {/if}
                    <input type=range bind:value={p2RemoteVal} min=0 max=5>
                    <p class="lead"><b>{p2RemoteVal} jours de télétravail</b></p>
                    <button class="btn btn-outline-primary" on:click={() => handleP2Remote(p2RemoteVal)}>Valider
                    </button>
                </div>
            </div>
        {/if}

        {#if p2Location}
            <div in:fade="{{ delay: 500 , duration: 1000 }}" out:fade="{{delay: 0, duration: 500}}">
                <h1 class="pb-4 mb-5 border-bottom border-primary">Localisation</h1>
                <div class="row">
                    <div class="col-6">
                        <div class="row">
                            <button class="btn btn-outline-primary" on:click={() => handleP2Location("44")}>
                                Département de Loire-Atlantique
                            </button>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="row">
                            <p class="lead">Si vous n'êtes pas dans le département de Loire-Atlantique merci de préciser
                                l'emplacement des bureaux</p>
                            <input class="form-control mt-4" bind:value={location} placeholder="Ville, Pays"
                                   type="text">
                            <button class="mt-3 btn btn-outline-primary" type="button"
                                    on:click={() => handleP2Location(location)}>
                                Valider
                            </button>
                            {#if p2InvalidLocation}
                                <div class="mt-3 alert alert-danger" role="alert">
                                    Merci de renseigner un lieu
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        {#if p2LocationRemoteDilemma}
            <div in:fade="{{ delay: 500 , duration: 1000 }}" out:fade="{{delay: 0, duration: 500}}">
                <h1 class="pb-4 mb-5 border-bottom border-primary">Tension : Localisation/Télétravail</h1>
                <div class="row justify-content-center">
                    <p class="lead">Votre bureau est en dehors de mon département et vous me proposer en
                        moyenne {remote} jours de télétravail par semaines.</p>
                    <p class="lead">Je ne souhaite pas déménager, ni passer beaucoup de temps dans les transports.</p>
                    <p class="lead">Consentez-vous à passer en moyenne quatre jours de télétravail par semaine ?</p>
                    <button class="col-4 m-3 btn btn-outline-primary"
                            on:click={() => handleP2locationRemoteDilemma(true)}>
                        Oui
                    </button>
                    <button class="col-4 m-3 btn btn-outline-primary"
                            on:click={() => handleP2locationRemoteDilemma(false)}>
                        Non
                    </button>
                </div>
            </div>
        {/if}

        {#if p3HL}
            <div in:fade="{{ delay: 500 , duration: 1000 }}" out:fade="{{delay: 0, duration: 500}}">
                <h1 class="pb-4 mb-5 border-bottom border-primary">Temps partiel</h1>
                <div class="row">
                    <p class="lead">Je suis bénévole dans l'association Hameaux Légers avec un engagement d'un jour par
                        semaine.</p>
                    <p class="lead">Afin de pouvoir continuer mon engagement dans cette association j'ai besoin d'avoir
                        un contrat maximum de quatre jours par semaines.</p>
                    <p class="lead">Est ce que cela est compatible avec votre offre d'emploi ?</p>
                    <button class="col-4 m-3 btn btn-outline-primary"
                            on:click={() => handleP3HL(true)}>
                        Oui
                    </button>
                    <button class="col-4 m-3 btn btn-outline-primary"
                            on:click={() => handleP3HL(false)}>
                        Non
                    </button>
                </div>
            </div>
        {/if}

        {#if p9Result}
            <div in:fade="{{ delay: 500 , duration: 1000 }}" out:fade="{{delay: 0, duration: 500}}">
                <h1 class="pb-4 mb-5 border-bottom border-primary">Merci {employerName}</h1>
                <div class="row">
                    <p class="lead">Le questionnaire se clot ici. Pour me contacter merci de télécharger le fichier CSV
                        ci dessous</p>
                    <CSVDownloader
                            data={[{
                            "employerName": employerName,
                            "sector": sector,
                            "contract": contract,
                            "remote": remote,
                            "loaction": location,
                            "locationRemoteDilemma": locationRemoteDilemma
                        }]}
                            type={'button'}
                            filename={'filename'}
                            bom={true}>
                        Télécharger le fichier
                    </CSVDownloader>
                    <div class="row mt-5">
                        <p class="lead">J'auto construit en ce moment ma maison la fin de chantier est prévu pour cet
                            été. Je serai disponible à partir de septembre (sauf mission à temps partielles et
                            freelance)</p>
                        <p class="lead">Pour prendre contact merci de m'envoyer un courriel à :</p>
                        <div class="col-5">
                            <h6 class="pb-2 my-3 border-bottom border-primary">Méthode Semi-Auto</h6>
                            <div class="row">
                                <a class="btn btn-outline-primary"
                                   href="mailto:damien@giraudet.me?subject=[job-success-v1.1]">Lien mailto</a>
                                <p class="text-sm-start mt-3"><kbd>avec le fichier .csv en pièce jointe</kbd></p>
                            </div>
                        </div>
                        <div class="col-7">
                            <h6 class="pb-2 my-3 border-bottom border-primary">Méthode Manuelle</h6>
                            <p class="text-justify"><kbd>damien@giraudet.me</kbd> avec comme préfixe à votre objet
                                <kbd>[job-success-v1.1]</kbd>.</p>
                            <p class="text-justify"> C'est important de bien mettre ce préfixe à votre objet et
                                <kbd>avec le fichier .csv en pièce jointe</kbd> sinon
                                <del>je</del>
                                mon automatisation ne traitera pas le courriel.
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        {#if p9GameOver}
            <div in:fade="{{ delay: 500 , duration: 1000 }}">
                <h1 class="pb-4 mb-5 border-bottom border-primary">Fin du voyage</h1>
                <div class="row">
                    <p class="lead">Merci {employerName} d'avoir répondu à ces question.</p>
                    <p class="lead">Nous ne pourrons pas travailler ensemble car {p9GameOverExplanation}</p>
                    <div class="row">
                        <p class="text-sm-start">Si malgré tout vous pensez que nous pourrions tout de même travailler
                            ensemble vous pouvez m'envoyer un courriel à :</p>
                        <div class="col-4">
                            <h6 class="pb-2 my-3 border-bottom border-primary">Méthode Auto</h6>
                            <div class="row">
                                <a class="btn btn-outline-primary"
                                   href="mailto:damien@giraudet.me?subject=[job-retry-v1.1]">
                                    Lien mailto</a>
                            </div>
                        </div>
                        <div class="col-8">
                            <h6 class="pb-2 my-3 border-bottom border-primary">Méthode Manuelle</h6>
                            <p class="text-justify"><kbd>damien@giraudet.me</kbd> avec comme préfixe de votre objet
                                <kbd>[job-retry-v1.1]</kbd>.</p>
                            <p class="text-justify"> C'est important de bien mettre ce préfixe à votre objet sinon
                                <del>je</del>
                                mon automatisation ne traitera pas le courriel.
                        </div>
                    </div>
                </div>
                <About/>
            </div>

        {/if}
    </main>

    <footer class="mt-auto text-white-50">
        <div class="progress">
            <div class="progress-bar progress-bar-striped" role="progressbar" style="width: {progressBar}%"
                 aria-valuenow="{progressBar}"
                 aria-valuemin="0"
                 aria-valuemax="100"></div>
        </div>
    </footer>

</div>