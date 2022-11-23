const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const { Recipe, Diet } = require('../db')
const axios = require("axios")
const {
     API_KEY,
   } = process.env;

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

router.get('/recipes', async function(req,res){
const {name}= req.query

     try{
          let resultado;
          //Se trae de la API
          
          let api= await axios.get(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&addRecipeInformation=true&number=10`)
          api= api.data.results.map(receta=>{
              
                   return {
                           
                            id:receta.id,
                            title:receta.title,
                            image:receta.image,
                            healthScore:receta.healthScore,
                            diets:receta.diets,
                            vegetarian:receta.vegetarian,
                            vegan:receta.vegan,
                            glutenFree:receta.glutenFree,
                            dairyFree:receta.dairyFree
                   } 
                   })
          
          //Se trae de la Base de Datos

          let bd=await Recipe.findAll({include:Diet})
          
          bd=bd?.map(receta=>{
               
               return {
                    id:receta.id,
                    title:receta.name,
                    healthScore:receta.healthScore,
                    diets:receta.dataValues.diets.map(e=>{
                         return e.name
                    })                  
                    //image:receta.image
               }
          })
        
          resultado=api.concat(bd)
               //Si se envia query
               if(name){
               
               const filtro=resultado.filter((receta)=>{
                         return receta.title.toLowerCase().includes(name.toLowerCase())
                   })
          
              if(filtro.length) {
                    res.json(filtro)                  
               }
               else{ res.send('No se encontraron resultados con el nombre de receta ingresado')}
          }
          else {
               //Envio todos los resultados
              if(resultado){
               res.json(resultado)
              }
               else{ res.send('No se encontraron resultados con el nombre de receta ingresado')}
          }
     }
    catch(e){
     res.redirect('/error')
    }
})

router.get('/recipes/:idReceta',async function(req,res){
     const {idReceta}=req.params
       
     try{     
         //Buscamos en la BD
         if(idReceta.includes('-')){

          let result=await Recipe.findByPk(idReceta)        
          if(result){               
               let resultadoBD=await Recipe.findOne({
                    where:{
                         id:idReceta
                    },include:Diet
                   })
                  
                   let dietas=await resultadoBD.getDiets()
                   dietas=dietas?.map(e=>{
                   return e.name
                   })
                   resultadoBD.dataValues.diets=dietas
                   res.json(resultadoBD.dataValues)  
               }         
          }                    
          else{      //Buscamos en la API                
               const resultadoApi=await axios.get(`https://api.spoonacular.com/recipes/${idReceta}/information?apiKey=${API_KEY}`)
                              const receta= {
                              image:resultadoApi.data.image,
                              title:resultadoApi.data.title,
                              dishTypes:resultadoApi.data.dishTypes,
                              summary:resultadoApi.data.summary,
                              healthScore:resultadoApi.data.healthScore,
                              steps:resultadoApi.data.instructions,
                              diets:resultadoApi.data.diets,
                              vegetarian:resultadoApi.data.vegetarian,
                              vegan:resultadoApi.data.vegan,
                              glutenFree:resultadoApi.data.glutenFree,
                              dairyFree:resultadoApi.data.dairyFree
                         }
                         res.json(receta)
               }
     }catch(e){
          res.redirect('/error')
     }
})

router.post('/recipes', async function(req,res){
     const {name, summary, healthScore,steps,diets}=req.body;
     
     try{
          if(!name || !summary) return res.status(404).send("Falta enviar datos que son neesarios")
          const receta=await Recipe.create(
               {
               name:name,
               summary:summary,
               healthScore:healthScore,
               steps:steps
          })
          await receta.addDiet(diets)
          
          res.status(201).json(receta)
     }catch(e){
          res.redirect('/error')
     }    

})

router.get('/diets',async function(req,res){
     try{
          let dietas=await Diet.findAll()
          if(!dietas.length){
               //buscar api
               dietas= await Diet.bulkCreate([
                    {name:"gluten free"},
                    {name:"dairy free"},
                    {name: "lacto ovo vegetarian"},
                    {name: "vegetarian"},
                    {name: "vegan"},
                    {name: "paleolithic"},
                    {name: "primal"},
                    {name: "whole 30"},
                    {name: "pescatarian"},
                    {name: "ketogenic"},    
                    {name: "fodmap friendly"}                     
                  
               ])
              
               res.json(dietas)
          }
          else res.json(dietas)
     }catch(e){
          res.redirect('/error')
     }
})

router.get('*',function(req,res){
     res.send("Esta ruta no existe")
})


module.exports = router;

