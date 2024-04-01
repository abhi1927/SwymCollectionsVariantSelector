
/* 
This is a product that generates dynamic filter options by fetching product JSON data from a Shopify End-point, 
and allows users to select their preferences and add products to one or more Swym Wishlists.

- Author: Abhishek Lal
- Email: support@swymcorp.com
- Related Files: swym-collections-modal.liquid, swym-custom-notification.liquid + file for button code.
- Date: 12th April, 2023.
*/

/*
Following Deferred Load: Code only executed after SWYM has loaded all necessary resources.
*/

function onSwymLoadCallback(swat) {
    const defaultListTitle = "My Wishlist";
    const multipleListContainer = document.getElementById("swym-multiple-wishlist-container");
    const createListButton = document.getElementById("swym-custom-create-list-button");
    const greetingWishlistText = document.getElementById("swym-multiple-wishlist-text");
    const wishlistButton = document.getElementById("swym-wishlist-collections-modal-btn");
    const inputFieldContainer = document.getElementById("swym-new-list-input-container");
    const shopifyCurrency = window.Shopify.currency.active;
  
    let swymProductVendor = document.getElementById("swym-product-vendor");
    let swymVariantImage = document.getElementById("swym-variant-image");
    let swymProductTitle = document.getElementById("swym-product-title");
    let swymVariantTitle = document.getElementById("swym-variant-title");
    let swymVariantPrice = document.getElementById("swym-variant-price");
    let productData = {};
    let selectCallBackObj = {}; // object that holds the variant selection.
    let arrayOfListId = [];
    let swymVariantModal = document.getElementById("swym-variant-selection-modal");
    let persistlistIdArray = [];
    let listObject = [];
  
     function customErrorHandling(error) {
          swat.ui.uiRef.showErrorNotification({ message: error });
        }
  
      function customSuccessHandling(success) {
          swat.ui.uiRef.showSuccessNotification({message: success,});
      }
  
  
    // swymCustomUiModal is the main helper object that houses all major functions required by the swym-variant-modal.
  
  
    const swymCustomUiModal = {
      // swymRootAPIWrapper is a sub-object that houses a few Swym-Primary-APIs with wrappers.
      swymRootAPIWrapper: {
        deleteList: function deleteList(lid) {
          let onSuccess = function (deletedListObj) {
            // Executed when list is successfully deleted
          };
          let onError = function (error) {
            console.error(`Error while deleting the List, ${lid}`, error);
          };
          swat.deleteList(lid, onSuccess, onError);
        },
        /* Function to add a product to one or more lists.
            productJson: product JSON response from the product URL,
            variant: variant ID generated from getSelectedVariant.
         */
        addProductToMultipleWishlists: function addProductToMultipleWishlists(
          productJson,
          variant
        ) {
          // Define your "product" before adding it to the wishlist (product).
          let productURL = window.location.origin + "/products/" + productJson.product.handle;
          let product = {
            epi: variant.id, // unique variant ID of the product.
            empi: productJson.product.id, // Product ID or master product ID
            du: productURL, // product url.
          };
  
          // Swym API to Add the product to multiple wishlists
          swat.addProductToLists(
            product,
            arrayOfListId,
            function (response) {
              swat.swymCustomUiModal.closeSwymModal();
            },
            function (error) {
              console.error("There was an error adding the product to wishlist", error);
            }
          );
        },
        // On click of create new list button
        createList: function createList(config) {
          let successCallback = function (listObj) {
    
            listObject.push(listObj);
            swat.swymCustomUiModal.addListInput(listObj);
          };
    
          let errorCallback = function (xhrObject) {
            console.error("Error creating list", xhrObject);
          };
    
          swat.createList(config, successCallback, errorCallback);
        },
         // To fetch a list's details (used to show added vs not added states)
        getlistDetails: function getlistDetails(lid) {
          swat.fetchListDetails(
            { lid },
            function (listContents) {
              // successfully fetched list details
              for (i = 0; i < listContents.items.length; i++) {
                if (!persistlistIdArray.includes(listContents.items[i].empi)) {
                  persistlistIdArray.push(listContents.items[i].empi);
                }
  
              }
  
              swat.swymCustomUiModal.addSwymAddedClass();
            },
            function (xhrObj) {
              // something went wrong
              console.warn("Error in getting list details", xhrObj);
            }
          );
        },
      },
      // To zoom on the product/variant image.
      showZoomedView: function showZoomedView() {
        const image = document.getElementById('swym-variant-image');
        const zoomedView = document.createElement('div');
        zoomedView.classList.add('zoomed-image');
        const zoomedImage = document.createElement('img');
        zoomedImage.src = image.src;
        zoomedView.appendChild(zoomedImage);
  
        const closeButton = document.createElement('button');
        closeButton.setAttribute('aria-label', 'Close zoomed image');
        closeButton.setAttribute('class', 'swym-zoomed-image-close-button');
        closeButton.classList.add('close-button');
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => {
          document.body.removeChild(zoomedView);
        });
        zoomedView.appendChild(closeButton);
  
        document.body.appendChild(zoomedView);
  
        zoomedView.addEventListener('click', (event) => {
          if (event.target === zoomedView) {
            document.body.removeChild(zoomedView);
          }
        });
      },
      // Create and return a new input element
      createListInput: function createListInput(listObj) {
        let newlyCreatedInput = document.createElement("input");
        newlyCreatedInput.setAttribute("type", "input");
        newlyCreatedInput.setAttribute("id", listObj.lid);
        newlyCreatedInput.setAttribute("list-name", listObj.lname);
        newlyCreatedInput.setAttribute("class", "swym-dynamic-lists");
        newlyCreatedInput.value = listObj.lname;
      
        return newlyCreatedInput;
      },
      
      // Create and return a new label element
      createLabel: function createListLabel(listObj) {
        let newlyCreatedLabel = document.createElement("label");
        newlyCreatedLabel.classList.add("list-container");
        newlyCreatedLabel.classList.add("radio-button-label");
        newlyCreatedLabel.setAttribute("for", listObj.lid);
      
        return newlyCreatedLabel;
      },
      // Create and return a new confirm button element
      createConfirmButton: function createConfirmButton(listObj) {
        let newlyCreatedConfirmButton = document.createElement("button");
        newlyCreatedConfirmButton.setAttribute("id", "swym-new-input-field");
        newlyCreatedConfirmButton.setAttribute("class", "swym-fresh-input");
        newlyCreatedConfirmButton.setAttribute("list-id", listObj.lid);
        newlyCreatedConfirmButton.setAttribute("aria-label", "Confirm Button");
        newlyCreatedConfirmButton.innerHTML = "Confirm";
      
        return newlyCreatedConfirmButton;
      },
     
      dispatchCreateNewListEvent: function dispatchCreateNewListEvent() {
        document.dispatchEvent(new CustomEvent("swym:create-new-list"));
      },
      
      // Clicks listener for list name update/confirm button.
      handleConfirmButtonClick: function handleConfirmButtonClick(e, newlyCreatedInput, inputFieldContainer, newlyCreatedLabel) {
        let listName = document.querySelector(".swym-dynamic-lists");
        if (listName.value.length < 3) {
          document.dispatchEvent(new CustomEvent("swym:list-name-error-message"));
          return;
        } else if (listName.value.length >= 3) {
          e.target.classList.add("swym-confirm-list-clicked");
          swat.swymCustomUiModal.handleListInputEvents(newlyCreatedInput, newlyCreatedLabel);
          inputFieldContainer.innerHTML = "";
        }
      },
      // Click the confirm button to update list name if a user clicks the enter key.
      handleInputKeyDown: function handleInputKeyDown(event) {
        if (event.key === "Enter") {
          let newlyCreatedConfirmButton = document.getElementById(
            "swym-new-input-field"
          );
          newlyCreatedConfirmButton.click();
        }
      },
     
      // Query for products that are already in wishlist and add the Swym-added class to it.
      addSwymAddedClass: function addSwymAddedClass() {
        let arrayOfCollectionsButtons = document.querySelectorAll(".swym-collections");
        if (arrayOfCollectionsButtons) {
          for (i = 0; i < arrayOfCollectionsButtons.length; i++) {
            let productId = Number(
              arrayOfCollectionsButtons[i].getAttribute("data-product-id")
            );
            const isAlreadyWishlisted = persistlistIdArray.find(
              (empi) => empi == productId
            );
            if (isAlreadyWishlisted) {
              arrayOfCollectionsButtons[i].classList.add("swym-added");
            }
          }
        } else {
          console.warn("No Swym-collections variant buttons found!");
        }
      },
     
      // Show added vs not added state on collections buttons page loads.
      persistWishlistState: function persistWishlistState() {
        persistlistIdArray = [];
        // Define success and error callback functions
        let successCallBackFn = function (lists) {
          // successfully fetched my lists
          for (i = 0; i < lists.length; i++) {
            let lid = lists[i].lid;
            swat.swymCustomUiModal.swymRootAPIWrapper.getlistDetails(lid); // not necessary, we can use lists[i].listcontents
          }
        };
        let errorCallBackFn = function (xhrObj) {
          // something went wrong
          console.error("Error in fetching current lists", xhrObj);
        };
  
        // call fetchLists
        swat.fetchLists({
          callbackFn: successCallBackFn,
          errorFn: errorCallBackFn,
        });
      },
      // If a user does not click the confirm name button, delete the previously created list.
      deleteIncompleteNewlists: function deleteIncompleteNewlists() {
        let confirmListCreationButton = document.getElementById(
          "swym-new-input-field"
        );
        if (confirmListCreationButton) {
          let listIdtoDelete = confirmListCreationButton.getAttribute("list-id");
          if (
            !confirmListCreationButton.classList.contains(
              "swym-confirm-list-clicked"
            )
          ) {
            swat.swymCustomUiModal.swymRootAPIWrapper.deleteList(listIdtoDelete);
            inputFieldContainer.innerHTML = "";
          } else {
            inputFieldContainer.innerHTML = "";
          }
        } else {
          return;
        }
      },
       // Function that clears the multiple list container.
      deleteStaleWishlists: function deleteStaleWishlists() {
        multipleListContainer.innerHTML = "";
      },
      // Function to close the Swym Variant Modal
      closeSwymModal: function closeSwymModal() {
        selectCallBackObj = {};
        swymVariantModal.querySelector("#swym-radio-container").innerHTML = "";
        swymVariantModal.classList.remove("swym-show-modal");
        swymVariantModal.classList.add("swym-hide-modal");
        swat.swymCustomUiModal.deleteStaleWishlists();
        swat.swymCustomUiModal.deleteIncompleteNewlists();
        document.dispatchEvent(new CustomEvent("swym:variant-modal-active", {
          detail: {
            isActive: false
          }
        }));
  
      },
      // Function to add a product to one or more lists. - done
      addProductToMultipleWishlists: function addProductToMultipleWishlists(
        productJson,
        variant
      ) {
        // Define your "product" before adding it to the wishlist (product).
        let productURL = window.location.origin + "/products/" + productJson.product.handle;
        let product = {
          epi: variant.id, // unique variant ID of the product.
          empi: productJson.product.id, // Product ID or master product ID
          du: productURL, // product url.
        };
  
        // Swym API to Add the product to multiple wishlists
        swat.addProductToLists(
          product,
          arrayOfListId,
          function (response) {
            swat.swymCustomUiModal.closeSwymModal();
          },
          function (error) {
            console.error("There was an error adding the product to wishlist", error);
          }
        );
      },
      // DO NOT TOUCH THIS FUNCTION: To throttle function responses.
      debounce_leading: function debounce_leading(func, timeout = 300) {
        let timer;
        return (...args) => {
          if (!timer) {
            func.apply(this, args);
          }
          clearTimeout(timer);
          timer = setTimeout(() => {
            timer = undefined;
          }, timeout);
        };
      },
      //DO NOT TOUCH THIS FUNCTION.
      convertObjectToString: function convertObjectToString(selectCallBackObj) {
        let str = "";
        for (let key in selectCallBackObj) {
          str += selectCallBackObj[key] + " / ";
        }
        return str.slice(0, -3);
      },
      //DO NOT TOUCH THIS FUNCTION.
      getSelectedVariant: function getSelectedVariant(
        selectCallBackObj,
        productJson,
        callbackFn
      ) {
        // DO NOT TOUCH THIS FUNCTION.
        let variants = productJson.product.variants;
        let selectedVariant = {};
        variants.forEach((variant) => {
          let filterTitle =
            swat.swymCustomUiModal.convertObjectToString(selectCallBackObj);
          if (filterTitle == variant.title) {
            callbackFn(variant);
            selectedVariant = variant;
            return;
          }
        });
        return selectedVariant;
      },
      // Mimicking swat.initializeActionButtons(), we wait for swat do load before collections buttons becomes visible.
      showButtonsOnlyWhenSwymLoaded: function showButtonsOnlyWhenSwymLoaded() {
        let arrayOfCollectionsButtons = document.querySelectorAll("[data-product-card-swym-heart]");
        let isVariantSelectionEnabled =  swat.retailerSettings.Wishlist.EnableVariantSelectionModal
        document.body.classList.add("swym-app-loaded")
        if (arrayOfCollectionsButtons && isVariantSelectionEnabled == true) {
          for (i = 0; i < arrayOfCollectionsButtons.length; i++) {
            arrayOfCollectionsButtons[i].classList.add("swym-loaded");
            // arrayOfCollectionsButtons[i].onclick = fetchProductDetails;
            // arrayOfCollectionsButtons[i].setAttribute("onclick", "fetchProductDetails(event)");
          }
        } else {
          console.warn("No Swym-collections variant buttons found!");
        }
      },
      // If no lists are selected, select the most recently created one.
      autoSelectDefaultWishlist: function autoSelectDefaultWishlist() {
        swat.swymCustomUiModal.toggleListHistory();
        let avaialableLists = document.querySelectorAll(".list-container");
        let selectedCount = 0;
        for (i = 0; i < avaialableLists.length; i++) {
          let isSelected = avaialableLists[i].classList.contains("list-selected");
          if (isSelected) {
            selectedCount++;
          }
        }
        if (selectedCount == 0 && avaialableLists.length > 0) {
          avaialableLists[0].click();
        }
      },
      // Function to disable/enable the add to wishlist button state based on lists selected (or) not selected. Call order - 7.
      toggleAddToWishlistButtonState: function toggleAddToWishlistButtonState() {
        if (arrayOfListId.length == 0) {
          wishlistButton.setAttribute("disabled", true);
          wishlistButton.classList.add("swym-button-disabled");
          wishlistButton.textContent = "Please select a list";
        } else if (arrayOfListId.length > 0) {
          wishlistButton.removeAttribute("disabled");
          wishlistButton.classList.remove("swym-button-disabled");
          wishlistButton.textContent = swat.retailerSettings.Strings.WishlistTooltipBefore;
        }
      },
      toggleMultipleWishlistText: function toggleMultipleWishlistText(lists) {
        if (lists.length != 0) {
          greetingWishlistText.textContent = "Add this item to one or more lists";
        } else {
          listObject = [];
        }
      },
      // Using local storage to preselect previously used wishlists.
      toggleListHistory: function toggleListHistory() {
        let localListItem = localStorage.getItem("stringOfListId");
        if (localListItem) {
          let arrayOfLocalListIds = JSON.parse(localListItem);
          for (i = 0; i < arrayOfLocalListIds.length; i++) {
            let myId = arrayOfLocalListIds[i];
            let imaginaryListToClick = document.querySelectorAll(`[for="${myId}"]`);
            imaginaryListToClick.forEach(function (element) {
              element.click();
            });
          }
        } else {
          return;
        }
      },
      // To toggle selected vs unselected multiple wishlists.
      selectListIds: function selectListIds() {
        arrayOfListId = [];
        let listContainers = document.querySelectorAll(".list-container");
        for (let i = 0; i < listContainers.length; i++) {
          let listContainer = listContainers[i];
          if (listContainer.classList.contains("list-selected")) {
            let listId = listContainer.getAttribute("for");
            if (!arrayOfListId.includes(listId)) {
              arrayOfListId.push(listId);
            }
          } else {
            let listId = listContainer.getAttribute("for");
            if (arrayOfListId.includes(listId)) {
              arrayOfListId.splice(arrayOfListId.indexOf(listId), 1);
            }
          }
        }
        const stringOfListId = JSON.stringify(arrayOfListId);
        localStorage.setItem("stringOfListId", stringOfListId);
        swat.swymCustomUiModal.toggleAddToWishlistButtonState();
      },
      // Adding click listeners to the selectable lists.
      addListLabelsClickListener: function addListLabelsClickListener() {
        let labels = document.querySelectorAll(".list-container");
        for (let i = 0; i < labels.length; i++) {
          labels[i].addEventListener("click", (e) => {
            e.currentTarget.classList.toggle("list-selected");
            swat.swymCustomUiModal.selectListIds();
          });
        }
      },
      // When user clicks on Create new list button
      createNewWishlist: function createNewWishlist() {
        let listNumber = (listObject.length || 0) + 1;
        if (listNumber <= 10) {
          let newListConfig = {
            lname: defaultListTitle + " " + listNumber,
          };
  
          swat.swymCustomUiModal.swymRootAPIWrapper.createList(newListConfig);
        } else {
          document.dispatchEvent(new CustomEvent("swym-list-limit-error"));
        }
  
      },
      // Calling the Swym create list API, @config is received from createNewWishlist, it contains the a default
      createList: function createList(config) {
        let successCallback = function (listObj) {
  
          listObject.push(listObj);
          swat.swymCustomUiModal.addListInput(listObj);
        };
  
        let errorCallback = function (xhrObject) {
          console.error("Error creating list", xhrObject);
        };
  
        swat.createList(config, successCallback, errorCallback);
      },
      // Create a new input for a new list.
      createNewInput: function createNewInput (listObj) {
        let newlyCreatedInput = document.createElement("input");
        newlyCreatedInput.setAttribute("type", "input");
        newlyCreatedInput.setAttribute("id", listObj.lid);
        newlyCreatedInput.setAttribute("list-name", listObj.lname);
        newlyCreatedInput.setAttribute("class", "swym-dynamic-lists");
        newlyCreatedInput.value = listObj.lname;
  
        return newlyCreatedInput
      },
      // Create a new label for a new list
      createNewLabel: function createNewLabel (listObj) {
        let newlyCreatedLabel = document.createElement("label");
        newlyCreatedLabel.classList.add("list-container");
        newlyCreatedLabel.classList.add("radio-button-label");
        newlyCreatedLabel.setAttribute("for", listObj.lid);
  
        return newlyCreatedLabel;
      },
      // Create a new list confirm button
      createNewConfirmButton: function createNewConfirmButton (listObj) {
        let newlyCreatedConfirmButton = document.createElement("button");
        newlyCreatedConfirmButton.setAttribute("id", "swym-new-input-field");
        newlyCreatedConfirmButton.setAttribute("class", "swym-fresh-input");
        newlyCreatedConfirmButton.setAttribute("list-id", listObj.lid);
        newlyCreatedConfirmButton.setAttribute("aria-label", "Confirm Button");
        newlyCreatedConfirmButton.innerHTML = "Confirm";
  
        return newlyCreatedConfirmButton;
      },
      /*
      Creates dynamic input and label combination to create new lists based on value of input field 
      and a class condition of the confirm button. 
      */
  
      addListInput: function addListInput(listObj) {
        let newlyCreatedInput = swat.swymCustomUiModal.createNewInput(listObj);
  
        let newlyCreatedLabel = swat.swymCustomUiModal.createNewLabel(listObj);
  
        let newlyCreatedConfirmButton = swat.swymCustomUiModal.createNewConfirmButton(listObj);
  
        inputFieldContainer.insertBefore(
          newlyCreatedInput,
          inputFieldContainer.firstChild
        );
        inputFieldContainer.insertBefore(
          newlyCreatedConfirmButton,
          inputFieldContainer.firstChild.nextSibling
        );
  
        newlyCreatedInput.focus();
        newlyCreatedInput.select();
  
        document.dispatchEvent(new CustomEvent("swym:create-new-list"));
  
        newlyCreatedConfirmButton.addEventListener("click", function (e) {
          let listName = document.querySelector(".swym-dynamic-lists");
          if (listName.value.length < 3) {
            document.dispatchEvent(new CustomEvent("swym:list-name-error-message"));
            return;
          } else if (listName.value.length >= 3) {
            e.target.classList.add("swym-confirm-list-clicked");
            swat.swymCustomUiModal.handleListInputEvents(newlyCreatedInput, newlyCreatedLabel);
            inputFieldContainer.innerHTML = "";
          }
        });
  
        newlyCreatedInput.addEventListener("keydown", function (e) {
          if (event.key === "Enter") {
            let newlyCreatedConfirmButton = document.getElementById(
              "swym-new-input-field"
            );
            newlyCreatedConfirmButton.click();
          }
        });
      },
      
      handleListInputEvents: function handleListInputEvents(input, label) {
        selectedList = input.getAttribute("id");
        newListName = input.value;
        let isSameName = arrayOfListId.includes(newListName);
        if (newListName.length < 3) {
          greetingWishlistText.textContent = "Minimum 3 characters required!";
          input.focus();
          input.value = defaultListTitle;
          return;
        } 
        else if (newListName.length >= 3) {
          swat.swymCustomUiModal.updateSingleListName(selectedList, newListName);
          input.setAttribute("disabled", true);
          input.setAttribute("type", "radio");
          input.style.display = "none";
          label.innerText = newListName;
  
          multipleListContainer.insertBefore(
            label,
            multipleListContainer.firstChild
          );
  
          label.addEventListener("click", (e) => {
            e.preventDefault();
            e.currentTarget.classList.toggle("list-selected");
            swat.swymCustomUiModal.selectListIds();
          });
  
          label.click();
          document.dispatchEvent(new CustomEvent("swym:new-list-created"));
        }
  
      },
  
      // Function to create a default Wishlist if no lists are present.
      createDefaultList: function createDefaultList(lists) {
        if (lists.length === 0) {
          arrayOfListId = [];
          swat.swymCustomUiModal.createNewWishlist(lists);
          swat.swymCustomUiModal.selectListIds();
        } else {
          return;
        }
      },
      // Function to render a user's current wishlists.
      renderCurrentWishlists: function renderCurrentWishlists(lists) {
        swat.swymCustomUiModal.createDefaultList(lists);
  
        for (let i = 0; i < lists.length; i++) {
          const listId = lists[i].lid;
          const listName = lists[i].lname;
  
          const newSingleList = swat.swymCustomUiModal.createListInput(listId, listName);
          const label = swat.swymCustomUiModal.createListLabel(listId, listName);
  
          multipleListContainer.appendChild(newSingleList);
          multipleListContainer.appendChild(label);
        }
  
        swat.swymCustomUiModal.addListLabelsClickListener();
        createListButton.addEventListener("click", swat.swymCustomUiModal.createNewWishlist);
        swat.swymCustomUiModal.autoSelectDefaultWishlist();
      },
      // Function to create a hidden input field underneath a label
      createListInput: function createListInput(listId, listName) {
        const newSingleList = document.createElement("input");
        newSingleList.setAttribute("type", "radio");
        newSingleList.setAttribute("id", listId);
        newSingleList.setAttribute("list-name", listName);
        newSingleList.setAttribute("class", "swym-dynamic-lists");
        newSingleList.setAttribute("aria-label", "Select list " + listName);
        newSingleList.style.display = "none";
  
        return newSingleList;
      },
      // Function to create a labels for above created listInputs. This is to mimic a radio button.
      createListLabel: function createListLabel(listId, listName) {
        const label = document.createElement("label");
        label.setAttribute("class", "list-container");
        label.setAttribute("for", listId);
        label.setAttribute("aria-label", "List " + listName);
        label.innerText = listName;
  
        return label;
      },
      // Function that updates/adds a list name.
      updateSingleListName: function updateSingleListName(singleListId, newListName) {
        var listUpdateMap = {
          lid: singleListId,
          lname: newListName,
        };
        swat.updateList(
          listUpdateMap,
          function (updateListObj) {
            // Successfully updated list
  
          },
          function () {
            // something went wrong
            console.warn("Error in creating list!");
          }
        );
      },
      // To fetch a user's current wishlists. Call order - 6
      fetchCurrentWishlists: function fetchCurrentWishlists() {
        // Define success and error callback functions
        let successCallBackFn = function (lists) {
          // successfully fetched my lists
  
          swat.swymCustomUiModal.toggleMultipleWishlistText(lists);
          swat.swymCustomUiModal.renderCurrentWishlists(lists);
          listObject = lists;
        };
        let errorCallBackFn = function (xhrObj) {
          // something went wrong
          console.warn("Error", xhrObj);
        };
        // call fetchLists
        swat.fetchLists({
          callbackFn: successCallBackFn,
          errorFn: errorCallBackFn,
        });
      },
      // Modal close button click listener add
      attachCloseButtonEvent: function attachCloseButtonEvent(modal) {
        let closeButton = modal.querySelector("#swym-close-btn");
        closeButton.addEventListener("click", swat.swymCustomUiModal.closeSwymModal);
      },
      // To add swym-show-modal class to show the Swym variant modal. Call order - 3.
      swymShowModal: function swymShowModal(modal) {
        modal.classList.add("swym-show-modal");
        window.onclick = function (event) {
          if (event.target == modal) {
            swat.swymCustomUiModal.closeSwymModal();
          }
        };
      },
      // To attach modal events, call order- 4.
      attachModalEvents: function attachModalEvents(modal) {
        // close button events
        swat.swymCustomUiModal.attachCloseButtonEvent(modal);
        swymVariantImage.addEventListener("click", swat.swymCustomUiModal.showZoomedView);
       },
  
      /*
      This function creates radio groups such as size, filter, material using productJson option(i) (i=1/2/3).
      The function can be modified to generate lists instead of radio buttons. You would need to modify
      handleRadioButtonClick () to suit accordingly. 
      */
  
      createRadioGroup: function createRadioGroup(option, optionIndex, productJson) {
        let variantOptions = option.values
          .map((value, valueIndex) => {
            return `<input style="display: none;" id="${option.name}-${value}" type="radio" name="${option.name}" optionIndex="${optionIndex}" value="${value}" aria-label="${option.name} ${value}"></input>
                      <label class="swym-filter-labels" for="${option.name}-${value}">${value}</label>`;
          })
          .join("");
  
        const radioGroup = document.createElement("div");
        radioGroup.setAttribute("class", `${option.name} swym-filter-option-name`);
        radioGroup.innerHTML = `<div id="swymOptionName" selected value="${option.name}">${option.name}</div>
                                  <div class="swym-radio-buttons-container">${variantOptions}</div>`;
  
        const radioButtons = radioGroup.querySelectorAll(`[name="${option.name}"]`);
        for (let i = 0; i < radioButtons.length; i++) {
          radioButtons[i].addEventListener("click", function (event) {
            swat.swymCustomUiModal.handleRadioButtonClick(event, productJson);
          });
        }
        return radioGroup;
      },
  
      // This function toggles the variant information on the modal, such as vendor, name, price, etc.
      toggleVariantData: function toggleVariantData(variant, productJson) {
        const currentProductTitle = productJson.product.title;
        const currentProductVendor = productJson.product.vendor;
        const alterNateVariantImages = productJson.product.images;
        let currentVariantTitle = variant.title.replace(/\//g, "");
        let currentVariantPrice = shopifyCurrency + ": " + variant.price;
        let imageId = variant.image_id;
  
        swymProductVendor.innerHTML = currentProductVendor;
        swymProductTitle.innerHTML = currentProductTitle;
        swymVariantTitle.innerHTML = currentVariantTitle;
        swymVariantPrice.innerHTML = currentVariantPrice;
  
        for (i = 0; i < alterNateVariantImages.length; i++) {
          if (alterNateVariantImages[i].id == imageId) {
            swymVariantImage.setAttribute("src", alterNateVariantImages[i].src);
            return;
          } else {
            swymVariantImage.setAttribute("src", productJson.product.image.src);
          }
        }
      },
      // Adding click listeners to the radio buttons
      handleRadioButtonClick: function handleRadioButtonClick(event, productJson) {
        const selectedValue = event.target.value;
        const optionIndex = event.currentTarget.getAttribute("optionIndex");
  
        selectCallBackObj = {
          ...selectCallBackObj,
          [optionIndex]: selectedValue,
        };
  
        swat.swymCustomUiModal.getSelectedVariant(
          selectCallBackObj,
          productJson,
          function (variant) {
  
            // function to toggle images
            swat.swymCustomUiModal.toggleVariantData(variant, productJson);
          }
        );
  
        // Add "selected" class to label of selected radio button
        const labels = event.currentTarget.parentNode.querySelectorAll(
          `label[for="${event.target.id}"]`
        );
        labels.forEach((label) => {
          label.classList.add("selected");
        });
  
        // Remove "selected" class from labels of unselected radio buttons
        const unselectedRadios = event.currentTarget.parentNode.querySelectorAll(
          `input[type="radio"]:not([value="${selectedValue}"])`
        );
        unselectedRadios.forEach((radio) => {
          const labels = event.currentTarget.parentNode.querySelectorAll(
            `label[for="${radio.id}"]`
          );
          labels.forEach((label) => {
            label.classList.remove("selected");
          });
        });
      },
      // Function that renders the variant selectos on the swym-radio-container. Call order - 5.
      renderVariantSelectors: function renderVariantSelectors(productJson, modal) {
        const optionsArray = productJson.product.options;
        const variantSelectors = optionsArray.map((option, optionIndex) => {
          return swat.swymCustomUiModal.createRadioGroup(option, optionIndex, productJson);
        });
  
        const listContainer = modal.querySelector("#swym-radio-container");
        variantSelectors.forEach((variantSelector) => {
          listContainer.append(variantSelector);
        });
  
        // Simulate click on the first radio button of each filter type
        variantSelectors.forEach((variantSelector) => {
          const radioButtons = variantSelector.querySelectorAll(
            'input[type="radio"]'
          );
          if (radioButtons.length > 0) {
            radioButtons[0].click();
          }
        });
  
      },
      // Function that opens the main Swym variant modal, call order - 2.
      openSwymVariantModal: function openSwymVariantModal(productJson, selectCallBackObj) {
        // Open the Swym variant modal here.
        swat.swymCustomUiModal.swymShowModal(swymVariantModal);
        swat.swymCustomUiModal.attachModalEvents(swymVariantModal, productJson);
        swat.swymCustomUiModal.renderVariantSelectors(productJson, swymVariantModal);
        swat.swymCustomUiModal.fetchCurrentWishlists();
        setTimeout(swat.swymCustomUiModal.toggleAddToWishlistButtonState, 1000);
        document.dispatchEvent(new CustomEvent("swym:new-list-created"));
        document.dispatchEvent(new CustomEvent("swym:variant-modal-active", {
          detail: {
            isActive: true
          }
        }));
       
      },
      // To handle collections button state of added product
       handleAddedToWishlist: function handleAddedToWishlist(event) {
        const targetProductId = event.detail.d.empi;
        let notificationMessage = event.detail.d.dt + " has been added to your Wishlist!";
        customSuccessHandling(notificationMessage);
        swat.swymCustomUiModal.updateSwymButtonState(targetProductId, true);
      },
      // To handle collections button state of removed product
      handleRemovedFromWishlist: function handleRemovedFromWishlist(event) {
        const targetProductId = event.detail.d.empi;
        swat.swymCustomUiModal.updateSwymButtonState(targetProductId, false);
      },
      // Main function that adds classes to the collections button based on if the product is in your wishlist.
      updateSwymButtonState: function updateSwymButtonState(targetProductId, isAdded) {
        let arrayOfSwymButtons = document.querySelectorAll(".swym-collections");
        for (let i = 0; i < arrayOfSwymButtons.length; i++) {
          const button = arrayOfSwymButtons[i];
          if (Number(button.getAttribute("data-product-id")) == targetProductId) {
            button.classList.toggle("swym-custom-added", isAdded);
            button.classList.toggle("swym-added", isAdded);
            swat.swymCustomUiModal.persistWishlistState();
            return;
          }
        }
      }
    };
  
    // DO NOT TOUCH THIS CODE - starts
  
    swat.swymCustomUiModal = swymCustomUiModal;
  
    document.addEventListener("swym:variant-modal-active", function (event) {
      const backGroundBody = document.querySelector("body");
      let isActiveModal = event.detail.isActive;
      if (isActiveModal) {
        backGroundBody.classList.add("swym-background-scroll-stop");
      } else {
        backGroundBody.classList.remove("swym-background-scroll-stop");
      }
    });
  
    document.addEventListener("swym:create-new-list", function () {
      greetingWishlistText.textContent = "Confirm New Wishlist Name";
      createListButton.setAttribute("disabled", true);
      createListButton.classList.add("swym-create-list-disabled");
    });
  
    document.addEventListener("swym:new-list-created", function () {
      greetingWishlistText.textContent = "Add this item to one or more Wishlists";
      createListButton.removeAttribute("disabled");
      createListButton.classList.remove("swym-create-list-disabled");
    });
    // Dispatch an event with the name "swym:collections-variant-button-load" to initialize the button on dynamic sections such as Filters/AJAX loads.
    document.addEventListener("swym:collections-variant-button-load", function () {
      swat.swymCustomUiModal.showButtonsOnlyWhenSwymLoaded();
    });
  
    document.addEventListener("swym:list-name-error-message", function () {
      greetingWishlistText.textContent = "Minimum 3 characters required!";
      setTimeout(() => {
        greetingWishlistText.textContent = "Add this item to one or more lists";
      }, 4500)
    });
  
    document.addEventListener("swym-list-limit-error", function () {
      greetingWishlistText.textContent = "Maximum list limit reached, please delete a list, or add to existing lists.";
    });
  
    
  // Onclick for the Add to Wishlist button on the Swym variant modal.
    addToMultipleListOnclick = function addToMultipleListOnclick(event) {
      if (productData) {
        let optionsArray = productData.product.options;
        if (Object.keys(selectCallBackObj).length == optionsArray.length) {
          let selectedVariant = swat.swymCustomUiModal.getSelectedVariant(
            selectCallBackObj,
            productData,
            function (variant) {
              swat.swymCustomUiModal.debounce_leading(
                swat.swymCustomUiModal.swymRootAPIWrapper.addProductToMultipleWishlists(
                  productData,
                  variant
                )
              );
              selectCallBackObj = {};
            }
          );
        }
      } else {
        console.error("No product json found!");
      }
    }
  
    /* 
    This is the starting point of a collections button click. This fetches product JSON from a Shopify product URL
    The function is throttled to prevent stale rendering on variant modal. - Call order: 1.
    */
  
    fetchProductDetails = swat.swymCustomUiModal.debounce_leading(function (event) {
      event.preventDefault();
      let rawUrl = event.target.attributes["data-product-url"].value;
      let productURL = rawUrl.split("?")[0];
      let shopifyProductEndpoint = productURL + ".json";
      fetch(shopifyProductEndpoint)
        .then((res) => res.json())
        .then((productJson) => {
          productData = productJson;
          setTimeout(swat.swymCustomUiModal.openSwymVariantModal(productJson), 0);
        });
    }, 500)  
  
    /* Show swym collections button only when swat is defined */
    swat.swymCustomUiModal.showButtonsOnlyWhenSwymLoaded();
  
    /* To add filled vs unfilled state */
    swat.swymCustomUiModal.persistWishlistState();
  
    swat.evtLayer.addEventListener(
      swat.JSEvents.addedToWishlist,
      swat.swymCustomUiModal.handleAddedToWishlist
    );
  
    swat.evtLayer.addEventListener(
      swat.JSEvents.removedFromWishlist,
      swat.swymCustomUiModal.handleRemovedFromWishlist
    );
  
  }
  // DO NOT TOUCH THIS CODE - ends
  if (!window.SwymCallbacks) {
    window.SwymCallbacks = [];
  }
  window.SwymCallbacks.push(onSwymLoadCallback);